const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const { signToken } = require("../lib/jwt");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const validate = require("../middlewares/validate");
const { authenticate, authorize } = require("../middlewares/auth");

const router = Router();

const registerSchema = {
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    role: z.enum(["ADMIN", "LIBRARIAN"]).optional()
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
};

function buildTokenForUser(user) {
  return signToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

router.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "Email ja cadastrado");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "LIBRARIAN"
      }
    });

    res.status(201).json({ data: sanitizeUser(user) });
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new HttpError(401, "Credenciais invalidas");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, "Credenciais invalidas");
    }

    const token = buildTokenForUser(user);

    res.json({
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new HttpError(404, "Usuario nao encontrado");
    }
    res.json({ data: sanitizeUser(user) });
  })
);

module.exports = router;
