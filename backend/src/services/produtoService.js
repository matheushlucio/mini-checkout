const { getDb } = require('../database/db');

function listarProdutos(nome) {
  const db = getDb();
  if (nome) {
    return db.prepare(
      `SELECT * FROM tblProdutos WHERE nome LIKE ? ORDER BY nome`
    ).all(`%${nome}%`);
  }
  return db.prepare(`SELECT * FROM tblProdutos ORDER BY nome`).all();
}

function buscarProdutoPorId(id) {
  return getDb().prepare(`SELECT * FROM tblProdutos WHERE id = ?`).get(id);
}

function cadastrarProduto({ nome, preco }) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Nome do produto é obrigatório.' };
  }
  if (preco === undefined || preco === null || isNaN(Number(preco)) || Number(preco) < 0) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Preço deve ser um número não negativo.' };
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO tblProdutos (nome, preco) VALUES (?, ?)`
  ).run(nome.trim(), Number(preco));

  return buscarProdutoPorId(result.lastInsertRowid);
}

module.exports = { listarProdutos, buscarProdutoPorId, cadastrarProduto };
