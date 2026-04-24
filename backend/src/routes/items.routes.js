const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate, authorize } = require("../middlewares/auth");
const { sendExport } = require("../utils/exporters");

const router = Router();

const ITEM_TYPES = ["BOOK", "MAGAZINE", "SUPPORT_MATERIAL"];

const idSchema = { params: z.object({ id: z.string().min(1) }) };

const createSchema = {
  body: z.object({
    code: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    subtitle: z.string().max(200).optional().nullable(),
    type: z.enum(ITEM_TYPES),
    description: z.string().max(2000).optional().nullable(),
    author: z.string().max(200).optional().nullable(),
    publisher: z.string().max(200).optional().nullable(),
    isbn: z.string().max(30).optional().nullable(),
    issn: z.string().max(30).optional().nullable(),
    edition: z.string().max(50).optional().nullable(),
    publicationYear: z.number().int().min(0).max(9999).optional().nullable(),
    language: z.string().max(50).optional().nullable(),
    shelfLocation: z.string().max(50).optional().nullable(),
    minimumQuantity: z.number().int().min(0).optional(),
    currentQuantity: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
};

const updateSchema = {
  params: idSchema.params,
  body: createSchema.body.partial()
};

const listSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    type: z.enum(ITEM_TYPES).optional(),
    lowStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  })
};

const exportSchema = {
  query: z.object({
    format: z.enum(["pdf", "xlsx"]),
    search: z.string().optional(),
    type: z.enum(ITEM_TYPES).optional()
  })
};

router.use(authenticate);

router.get(
  "/",
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 20;
    const { search, type, isActive, lowStock } = req.query;

    const where = {
      ...(type ? { type } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { author: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { isbn: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, items] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        orderBy: { title: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const filtered = lowStock
      ? items.filter((item) => item.currentQuantity <= item.minimumQuantity)
      : items;

    res.json({
      data: filtered.map((item) => ({
        ...item,
        isLowStock: item.currentQuantity <= item.minimumQuantity
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  "/alerts/low-stock",
  asyncHandler(async (_req, res) => {
    const items = await prisma.$queryRaw`
      SELECT * FROM "items"
      WHERE "isActive" = true AND "currentQuantity" <= "minimumQuantity"
      ORDER BY ("minimumQuantity" - "currentQuantity") DESC
    `;
    res.json({ data: items });
  })
);

router.get(
  "/export",
  validate(exportSchema),
  asyncHandler(async (req, res) => {
    const { format, search, type } = req.query;
    const rows = await prisma.item.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } }
              ]
            }
          : {}),
        ...(type ? { type } : {})
      },
      orderBy: { title: "asc" }
    });

    await sendExport(res, {
      format,
      fileName: `itens-${Date.now()}`,
      title: "Relatorio de Itens",
      columns: [
        { key: "code", header: "Codigo" },
        { key: "title", header: "Titulo" },
        { key: "type", header: "Tipo" },
        { key: "currentQuantity", header: "Quantidade" },
        { key: "minimumQuantity", header: "Minimo" }
      ],
      rows
    });
  })
);

router.get(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });
    if (!item) throw new HttpError(404, "Item nao encontrado");
    res.json({
      data: {
        ...item,
        isLowStock: item.currentQuantity <= item.minimumQuantity
      }
    });
  })
);

router.post(
  "/",
  authorize("ADMIN", "LIBRARIAN"),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.item.create({ data: req.body });
    res.status(201).json({ data: item });
  })
);

router.patch(
  "/:id",
  authorize("ADMIN", "LIBRARIAN"),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ data: item });
  })
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const openLoans = await prisma.loan.count({
      where: { itemId: req.params.id, status: { in: ["OPEN", "LATE"] } }
    });
    if (openLoans > 0) {
      throw new HttpError(
        409,
        "Item possui emprestimos em aberto e nao pode ser removido"
      );
    }
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ data: item });
  })
);

module.exports = router;
