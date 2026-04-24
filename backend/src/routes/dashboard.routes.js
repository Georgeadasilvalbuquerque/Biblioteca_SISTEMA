const { Router } = require("express");

const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middlewares/auth");

const router = Router();

router.use(authenticate);

// Endpoint consolidado para alimentar o dashboard do frontend.
router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalItems, availableNow, entries, exits, allItemsForStock, recentMovements] =
      await Promise.all([
        prisma.item.count({ where: { isActive: true } }),
        prisma.item.aggregate({
          _sum: { currentQuantity: true },
          where: { isActive: true }
        }),
        prisma.movement.aggregate({
          _sum: { quantity: true },
          where: { type: "ENTRY", createdAt: { gte: startOfMonth } }
        }),
        prisma.movement.aggregate({
          _sum: { quantity: true },
          where: { type: { in: ["EXIT", "LOAN", "LOSS"] }, createdAt: { gte: startOfMonth } }
        }),
        prisma.item.findMany({
          where: { isActive: true },
          select: { id: true, code: true, title: true, currentQuantity: true, minimumQuantity: true }
        }),
        prisma.movement.findMany({
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            item: { select: { code: true, title: true } }
          }
        })
      ]);

    const lowStock = allItemsForStock
      .filter((item) => item.currentQuantity <= item.minimumQuantity)
      .sort((a, b) => a.currentQuantity - b.currentQuantity)
      .slice(0, 8);

    res.json({
      data: {
        cards: {
          totalItems,
          entriesInMonth: entries._sum.quantity || 0,
          exitsInMonth: exits._sum.quantity || 0,
          availableNow: availableNow._sum.currentQuantity || 0
        },
        lowStock,
        recentMovements
      }
    });
  })
);

module.exports = router;
