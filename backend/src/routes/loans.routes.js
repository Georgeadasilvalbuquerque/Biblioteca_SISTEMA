const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const { sendExport } = require("../utils/exporters");

const router = Router();

const LOAN_STATUS = ["OPEN", "RETURNED", "LATE", "CANCELLED"];

const idSchema = { params: z.object({ id: z.string().min(1) }) };

const createSchema = {
  body: z.object({
    itemId: z.string().min(1),
    memberId: z.string().min(1),
    quantity: z.number().int().min(1).optional(),
    dueDate: z.coerce.date(),
    notes: z.string().max(1000).optional().nullable()
  })
};

const listSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(LOAN_STATUS).optional(),
    itemId: z.string().optional(),
    memberId: z.string().optional(),
    overdue: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  })
};

const exportSchema = {
  query: z.object({
    format: z.enum(["pdf", "xlsx"]),
    status: z.enum(LOAN_STATUS).optional()
  })
};

router.use(authenticate);

router.get(
  "/",
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { status, itemId, memberId, overdue } = req.query;

    const where = {
      ...(status ? { status } : {}),
      ...(itemId ? { itemId } : {}),
      ...(memberId ? { memberId } : {}),
      ...(overdue
        ? {
            status: { in: ["OPEN", "LATE"] },
            dueDate: { lt: new Date() }
          }
        : {})
    };

    const [total, loans] = await Promise.all([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        orderBy: { loanDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          item: { select: { id: true, code: true, title: true } },
          member: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } }
        }
      })
    ]);

    res.json({
      data: loans,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  "/export",
  validate(exportSchema),
  asyncHandler(async (req, res) => {
    const rows = await prisma.loan.findMany({
      where: {
        ...(req.query.status ? { status: req.query.status } : {})
      },
      orderBy: { loanDate: "desc" },
      include: {
        item: { select: { code: true, title: true } },
        member: { select: { name: true } }
      }
    });

    await sendExport(res, {
      format: req.query.format,
      fileName: `emprestimos-${Date.now()}`,
      title: "Relatorio de Emprestimos",
      columns: [
        { key: "loanDate", header: "Data emprestimo" },
        { key: "dueDate", header: "Vencimento" },
        { key: "status", header: "Status" },
        { key: "quantity", header: "Quantidade" },
        { key: "item", header: "Item" },
        { key: "member", header: "Membro" }
      ],
      rows: rows.map((row) => ({
        ...row,
        item: row.item ? `${row.item.code} - ${row.item.title}` : "",
        member: row.member?.name || ""
      }))
    });
  })
);

router.get(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        item: true,
        member: true,
        createdBy: { select: { id: true, name: true } }
      }
    });
    if (!loan) throw new HttpError(404, "Emprestimo nao encontrado");
    res.json({ data: loan });
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { itemId, memberId, dueDate, notes } = req.body;
    const quantity = req.body.quantity || 1;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new HttpError(404, "Item nao encontrado ou inativo");
      }
      if (item.currentQuantity < quantity) {
        throw new HttpError(409, "Quantidade indisponivel em estoque");
      }

      const member = await tx.member.findUnique({ where: { id: memberId } });
      if (!member || !member.isActive) {
        throw new HttpError(404, "Membro nao encontrado ou inativo");
      }

      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) {
        throw new HttpError(400, "Data de devolucao invalida");
      }

      const now = new Date();
      const initialStatus = due.getTime() < now.getTime() ? "LATE" : "OPEN";

      const newQuantity = item.currentQuantity - quantity;
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: newQuantity }
      });

      const loan = await tx.loan.create({
        data: {
          itemId: item.id,
          memberId: member.id,
          createdById: req.user.id,
          quantity,
          dueDate: due,
          status: initialStatus,
          notes: notes || null
        }
      });

      await tx.movement.create({
        data: {
          itemId: item.id,
          userId: req.user.id,
          type: "LOAN",
          quantity,
          previousQuantity: item.currentQuantity,
          newQuantity,
          reason: `Emprestimo ${loan.id}`
        }
      });

      return { loan, item: updatedItem };
    });

    res.status(201).json({ data: result.loan });
  })
);

router.post(
  "/:id/return",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: req.params.id } });
      if (!loan) {
        throw new HttpError(404, "Emprestimo nao encontrado");
      }
      if (loan.status === "RETURNED") {
        throw new HttpError(409, "Emprestimo ja foi devolvido");
      }
      if (loan.status === "CANCELLED") {
        throw new HttpError(409, "Emprestimo cancelado nao pode ser devolvido");
      }

      const item = await tx.item.findUnique({ where: { id: loan.itemId } });
      const newQuantity = item.currentQuantity + loan.quantity;

      await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: newQuantity }
      });

      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: { status: "RETURNED", returnDate: new Date() }
      });

      await tx.movement.create({
        data: {
          itemId: item.id,
          userId: req.user.id,
          type: "RETURN",
          quantity: loan.quantity,
          previousQuantity: item.currentQuantity,
          newQuantity,
          reason: `Devolucao emprestimo ${loan.id}`
        }
      });

      return updatedLoan;
    });

    res.json({ data: result });
  })
);

router.post(
  "/:id/cancel",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: req.params.id } });
      if (!loan) throw new HttpError(404, "Emprestimo nao encontrado");
      if (loan.status !== "OPEN" && loan.status !== "LATE") {
        throw new HttpError(409, "Somente emprestimos em aberto podem ser cancelados");
      }

      const item = await tx.item.findUnique({ where: { id: loan.itemId } });
      const newQuantity = item.currentQuantity + loan.quantity;

      await tx.item.update({
        where: { id: item.id },
        data: { currentQuantity: newQuantity }
      });

      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: { status: "CANCELLED" }
      });

      await tx.movement.create({
        data: {
          itemId: item.id,
          userId: req.user.id,
          type: "ADJUSTMENT",
          quantity: loan.quantity,
          previousQuantity: item.currentQuantity,
          newQuantity,
          reason: `Cancelamento emprestimo ${loan.id}`
        }
      });

      return updatedLoan;
    });

    res.json({ data: result });
  })
);

module.exports = router;
