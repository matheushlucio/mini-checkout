const db = require("../database/db");

async function criarCliente(nome, email) {
  const result = await db.run(
    "INSERT INTO clients (nome, email) VALUES (?, ?)",
    [nome, email]
  );

  return {
    id: result.lastID,
    nome,
    email,
  };
}

async function listarClientes() {
  return db.all("SELECT * FROM clients");
}

async function buscarCliente(id) {
  return db.get("SELECT * FROM clients WHERE id = ?", [id]);
}

module.exports = {
  criarCliente,
  listarClientes,
  buscarCliente,
};