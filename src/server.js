const app = require("./app");
const db = require("./database/db");

(async () => {
  try {
    await db.init();
    app.listen(3000, () => {
      console.log("Servidor rodando em http://localhost:3000");
    });
  } catch (err) {
    console.error("Erro ao iniciar banco:", err);
    process.exit(1);
  }
})();
