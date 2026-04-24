const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const { sendExport } = require("../utils/exporters");

const router = Router();

const MOVEMENT_TYPES = [
  "ENTRY",
  "EXIT",
  "LOAN",
  "RETURN",
  "ADJUSTMENT",
  "LOSS"
];

const idSchema = { params: z.object({ id: z.string().min(1) }) };

const createSchema = {
  body: z.object({
    itemId: z.string().min(1),
    type: z.enum(["ENTRY", "EXIT", "ADJUSTMENT", "LOSS"]),
    quantity: z.number().int().refine((v) => v !== 0, {
      message: "quantity nao pode ser zero"
    }),
    reason: z.string().max(255).optional().nullable(),
    notes: z.string().max(1000).optional().nullable()
  })
};

const listSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    itemId: z.string().optional(),
    userId: z.string().optional(),
    type: z.enum(MOVEMENT_TYPES).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
};

const exportSchema = {
  query: z.object({
    format: z.enum(["pdf", "xlsx"]),
    type: z.enum(MOVEMENT_TYPES).optional()
  })
};

function computeDelta(type, quantity) {
  const absolute = Math.abs(quantity);
  switch (type) {
    case "ENTRY":
      return absolute;
    case "EXIT":
    case "LOSS":
      return -absolute;
    case "ADJUSTMENT":
      return quantity;
    default:
      throw new HttpError(400, "Tipo de movimentacao nao suportado nesta rota");
  }
}

router.use(authenticate);

router.get(
  "/",
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { itemId, userId, type, from, to } = req.query;

    const where = {
      ...(itemId ? { itemId } : {}),
      ...(userId ? { userId } : {}),
      ...(type ? { type } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    };

    const [total, movements] = await Promise.all([
      prisma.movement.count({ where }),
      prisma.movement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          item: { select: { id: true, code: true, title: true } },
          user: { select: { id: true, name: true } }
        }
      })
    ]);

    res.json({
      data: movements,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  "/export",
  validate(exportSchema),
  asyncHandler(async (req, res) => {
    const rows = await prisma.movement.findMany({
      where: {
        ...(req.query.type ? { type: req.query.type } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { code: true, title: true } },
        user: { select: { name: true } }
      }
    });

    await sendExport(res, {
      format: req.query.format,
      fileName: `movimentacoes-${Date.now()}`,
      title: "Relatorio de Movimentacoes",
      columns: [
        { key: "createdAt", header: "Data" },
        { key: "type", header: "Tipo" },
        { key: "quantity", header: "Quantidade" },
        { key: "item", header: "Item" },
        { key: "user", header: "Usuario" }
      ],
      rows: rows.map((row) => ({
        ...row,
        item: row.item ? `${row.item.code} - ${row.item.title}` : "",
        user: row.user?.name || ""
      }))
    });
  })
);

router.get(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const movement = await prisma.movement.findUnique({
      where: { id: req.params.id },
      include: {
        item: { select: { id: true, code: true, title: true } },
        user: { select: { id: true, name: true } }
      }
    });
    if (!movement) throw new HttpError(404, "Movimentacao nao encontrada");
    res.json({ data: movement });
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { itemId, type, quantity, reason, notes } = req.body;
    const delta = computeDelta(type, quantity);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new HttpError(404, "Item nao encontrado");
      }
      if (!item.isActive) {
        throw new HttpError(409, "Item inativo nao pode movimentar estoque");
      }

      const newQuantity = item.currentQuantity + delta;
      if (newQuantity < 0) {
        throw new HttpError(
          409,
          "Estoque insuficiente para realizar esta movimentacao"
        );
      }

      const updated = await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: newQuantity }
      });

      const movement = await tx.movement.create({
        data: {
          itemId: item.id,
          userId: req.user.id,
          type,
          quantity: Math.abs(quantity),
          previousQuantity: item.currentQuantity,
          newQuantity,
          reason: reason || null,
          notes: notes || null
        }
      });

      return { movement, item: updated };
    });

    res.status(201).json({
      data: {
        ...result.movement,
        item: {
          ...result.item,
          isLowStock:
            result.item.currentQuantity <= result.item.minimumQuantity
        }
      }
    });
  })
);

module.exports = router;
