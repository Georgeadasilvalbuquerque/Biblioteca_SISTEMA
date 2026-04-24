const { ItemType, MovementType, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Reutiliza o cliente Prisma configurado para Prisma 7 + Neon adapter.
const prisma = require("../src/lib/prisma");

async function main() {
  console.log("Iniciando seed do banco biblioteca_db...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@biblioteca.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@biblioteca.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  });

  console.log(`Admin pronto: ${admin.name} <${admin.email}>`);

  const items = [
    {
      code: "LIV-001",
      title: "Dom Casmurro",
      type: ItemType.BOOK,
      author: "Machado de Assis",
      publisher: "Editora Exemplo",
      minimumQuantity: 2,
      currentQuantity: 5,
      shelfLocation: "A1"
    },
    {
      code: "REV-001",
      title: "Revista Ciencia Hoje",
      type: ItemType.MAGAZINE,
      minimumQuantity: 3,
      currentQuantity: 4,
      shelfLocation: "B2"
    },
    {
      code: "MAT-001",
      title: "Atlas Geografico",
      type: ItemType.SUPPORT_MATERIAL,
      minimumQuantity: 1,
      currentQuantity: 2,
      shelfLocation: "C3"
    }
  ];

  for (const itemData of items) {
    const item = await prisma.item.upsert({
      where: { code: itemData.code },
      update: itemData,
      create: itemData
    });

    const existingInitialMovement = await prisma.movement.findFirst({
      where: {
        itemId: item.id,
        type: MovementType.ENTRY,
        reason: "Carga inicial do sistema"
      }
    });

    if (!existingInitialMovement) {
      await prisma.movement.create({
        data: {
          itemId: item.id,
          userId: admin.id,
          type: MovementType.ENTRY,
          quantity: item.currentQuantity,
          previousQuantity: 0,
          newQuantity: item.currentQuantity,
          reason: "Carga inicial do sistema"
        }
      });
    }
  }

  console.log(`Itens processados: ${items.length}`);
  console.log("Seed concluido com sucesso.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
