require("dotenv").config();

const createApp = require("./app");
const prisma = require("./lib/prisma");

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Servidor biblioteca_sistema rodando em http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`\nRecebido sinal ${signal}. Encerrando o servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown ("SIGINT"));
process.on("SIGTERM", () =>  shutdown ("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
  shutdown("unhandledRejection");
});
