const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate, authorize } = require("../middlewares/auth");

const router = Router();

const idSchema = { params: z.object({ id: z.string().min(1) }) };

const listSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    role: z.enum(["ADMIN", "LIBRARIAN"]).optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  })
};

const updateSchema = {
  params: idSchema.params,
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).max(100).optional(),
    role: z.enum(["ADMIN", "LIBRARIAN"]).optional(),
    isActive: z.boolean().optional()
  })
};

function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

router.use(authenticate, authorize("ADMIN"));

router.get(
  "/",
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { search, role, isActive } = req.query;

    const where = {
      ...(role ? { role } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      data: users.map(sanitizeUser),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, "Usuario nao encontrado");
    res.json({ data: sanitizeUser(user) });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const data = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data
    });

    res.json({ data: sanitizeUser(user) });
  })
);

router.delete(
  "/:id",
  validate(idSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw new HttpError(400, "Nao e possivel desativar o proprio usuario");
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ data: sanitizeUser(user) });
  })
);

module.exports = router;
