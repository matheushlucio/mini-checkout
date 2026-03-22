const { getDb } = require('../database/db');

function listarClientes() {
  return getDb().prepare(`SELECT * FROM tblClientes ORDER BY nome`).all();
}

function buscarClientePorId(id) {
  return getDb().prepare(`SELECT * FROM tblClientes WHERE id = ?`).get(id);
}

function cadastrarCliente({ nome, email }) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Nome do cliente é obrigatório.' };
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'E-mail inválido.' };
  }

  const db = getDb();
  const existe = db.prepare(`SELECT id FROM tblClientes WHERE email = ?`).get(email.trim());
  if (existe) {
    throw { status: 409, code: 'CONFLICT', message: 'E-mail já cadastrado.' };
  }

  const result = db.prepare(
    `INSERT INTO tblClientes (nome, email) VALUES (?, ?)`
  ).run(nome.trim(), email.trim().toLowerCase());

  return buscarClientePorId(result.lastInsertRowid);
}

module.exports = { listarClientes, buscarClientePorId, cadastrarCliente };
