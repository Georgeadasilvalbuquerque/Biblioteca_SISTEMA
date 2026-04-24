require("dotenv/config");

const bcrypt = require("bcryptjs");
const prisma = require("./lib/prisma");

async function main() {
  const email = `alice-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash("senha-temporaria", 10);

  const newUser = await prisma.user.create({
    data: {
      name: "Alice",
      email,
      passwordHash,
      role: "LIBRARIAN"
    }
  });
  console.log("Created user:", newUser);

  const foundUser = await prisma.user.findUnique({
    where: { id: newUser.id }
  });
  console.log("Found user:", foundUser);

  const updatedUser = await prisma.user.update({
    where: { id: newUser.id },
    data: { name: "Alice Smith" }
  });
  console.log("Updated user:", updatedUser);

  await prisma.user.delete({ where: { id: newUser.id } });
  console.log("Deleted user.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
