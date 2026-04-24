const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const { sendExport } = require("../utils/exporters");

const router = Router();

const idSchema = { params: z.object({ id: z.string().min(1) }) };

const createSchema = {
  body: z.object({
    name: z.string().min(2).max(150),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    document: z.string().max(30).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
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
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  })
};

const exportSchema = {
  query: z.object({
    format: z.enum(["pdf", "xlsx"]),
    search: z.string().optional()
  })
};

router.use(authenticate);

router.get(
  "/",
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { search, isActive } = req.query;

    const where = {
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { document: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      data: members,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  "/export",
  validate(exportSchema),
  asyncHandler(async (req, res) => {
    const rows = await prisma.member.findMany({
      where: {
        ...(req.query.search
          ? {
              OR: [
                { name: { contains: req.query.search, mode: "insensitive" } },
                { email: { contains: req.query.search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { name: "asc" }
    });

    await sendExport(res, {
      format: req.query.format,
      fileName: `membros-${Date.now()}`,
      title: "Relatorio de Membros",
      columns: [
        { key: "name", header: "Nome" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Telefone" },
        { key: "document", header: "Documento" },
        { key: "isActive", header: "Ativo" }
      ],
      rows
    });
  })
);

router.get(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        loans: {
          orderBy: { loanDate: "desc" },
          take: 20,
          include: { item: true }
        }
      }
    });
    if (!member) throw new HttpError(404, "Membro nao encontrado");
    res.json({ data: member });
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const member = await prisma.member.create({ data: req.body });
    res.status(201).json({ data: member });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ data: member });
  })
);

router.delete(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const openLoans = await prisma.loan.count({
      where: { memberId: req.params.id, status: { in: ["OPEN", "LATE"] } }
    });
    if (openLoans > 0) {
      throw new HttpError(
        409,
        "Membro possui emprestimos em aberto e nao pode ser removido"
      );
    }
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ data: member });
  })
);

module.exports = router;