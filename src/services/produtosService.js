const db = require("../database/db");

/**
 * Cria um novo produto no banco de dados
 * @param {string} nome - Nome do produto
 * @param {number} preco - Preço do produto
 * @returns {Object} Produto criado com id, nome e preco
 */
async function criarProduto(nome, preco) {
  const resultado = await db.run(
    "INSERT INTO products (nome, preco) VALUES (?, ?)",
    [nome, preco],
  );

  const produtoCriado = await db.get(
    "SELECT id, nome, preco FROM products WHERE id = ?",
    [resultado.lastID],
  );

  return produtoCriado;
}

/**
 * Lista todos os produtos disponíveis
 * @returns {Array} Array de produtos com id, nome e preco
 */
async function listarProdutos() {
  return await db.all("SELECT id, nome, preco FROM products");
}

/**
 * Deleta um produto pelo ID
 * @param {number} id - ID do produto a deletar
 * @throws {Error} Se o produto não existir
 */
async function deletarProduto(id) {
  const produtoExistente = await db.get(
    "SELECT id FROM products WHERE id = ?",
    [id],
  );

  if (!produtoExistente) {
    throw new Error("Produto não encontrado");
  }

  await db.run("DELETE FROM products WHERE id = ?", [id]);
}

module.exports = {
  criarProduto,
  listarProdutos,
  deletarProduto,
};
