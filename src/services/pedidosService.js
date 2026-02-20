const db = require("../database/db");

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida a quantidade de um item
 * @param {number} quantidade - Quantidade a validar
 * @throws {Error} Se quantidade for <= 0
 */
function validarQuantidade(quantidade) {
  if (quantidade == null || quantidade <= 0) {
    throw new Error("Quantidade não pode ser zero ou negativa");
  }
}

/**
 * Valida se um produto existe no banco
 * @param {number} produtoId - ID do produto
 * @returns {Object} Produto encontrado
 * @throws {Error} Se produto não existir
 */
async function validarProdutoExistente(produtoId) {
  const produto = await db.get("SELECT id FROM products WHERE id = ?", [
    produtoId,
  ]);

  if (!produto) {
    throw new Error("Não é possível adicionar item de produto inexistente");
  }

  return produto;
}

/**
 * Valida se um pedido existe e obtém seu status
 * @param {number} pedidoId - ID do pedido
 * @returns {Object} Pedido encontrado com id e status
 * @throws {Error} Se pedido não existir
 */
async function validarPedidoExistente(pedidoId) {
  const pedido = await db.get("SELECT id, status FROM orders WHERE id = ?", [
    pedidoId,
  ]);

  if (!pedido) {
    throw new Error("Pedido não encontrado");
  }

  return pedido;
}

/**
 * Valida se um pedido ainda está aberto (não finalizado)
 * @param {Object} pedido - Objeto pedido com status
 * @throws {Error} Se pedido estiver finalizado
 */
function validarPedidoAberto(pedido) {
  if (pedido.status === "FINALIZADO") {
    throw new Error("Pedido finalizado não pode receber novos itens");
  }
}

// ============================================================================
// OPERAÇÕES DE PEDIDO
// ============================================================================

/**
 * Cria um novo pedido com itens
 * @param {Array} itens - Array de itens { produtoId, quantidade }
 * @returns {Object} Pedido criado com detalhes completos
 * @throws {Error} Se itens forem inválidos ou produto não existir
 */
async function criarPedido(itens) {
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    throw new Error("Pedido deve ter pelo menos um item");
  }

  // Criar registro do pedido no banco
  const resultado = await db.run(
    "INSERT INTO orders (status, created_at) VALUES (?, datetime('now'))",
    ["FINALIZADO"],
  );
  const pedidoId = resultado.lastID;

  // Inserir cada item do pedido
  for (const item of itens) {
    validarQuantidade(item.quantidade);
    await validarProdutoExistente(item.produtoId);

    await db.run(
      "INSERT INTO order_items (order_id, product_id, quantidade) VALUES (?, ?, ?)",
      [pedidoId, item.produtoId, item.quantidade],
    );
  }

  return await montarPedido(pedidoId);
}

/**
 * Adiciona um item a um pedido aberto
 * @param {number} pedidoId - ID do pedido
 * @param {number} produtoId - ID do produto
 * @param {number} quantidade - Quantidade do item
 * @throws {Error} Se pedido não existir, produto não existir ou pedido finalizado
 */
async function adicionarItem(pedidoId, produtoId, quantidade) {
  validarQuantidade(quantidade);

  const pedido = await validarPedidoExistente(pedidoId);
  validarPedidoAberto(pedido);

  await validarProdutoExistente(produtoId);

  await db.run(
    "INSERT INTO order_items (order_id, product_id, quantidade) VALUES (?, ?, ?)",
    [pedidoId, produtoId, quantidade],
  );
}

/**
 * Finaliza um pedido (muda status para FINALIZADO)
 * @param {number} pedidoId - ID do pedido
 * @throws {Error} Se pedido não existir
 */
async function finalizarPedido(pedidoId) {
  await validarPedidoExistente(pedidoId);

  await db.run("UPDATE orders SET status = ? WHERE id = ?", [
    "FINALIZADO",
    pedidoId,
  ]);
}

/**
 * Lista todos os pedidos finalizados
 * @returns {Array} Array de pedidos com itens, total e data
 */
async function listarPedidos() {
  const pedidos = await db.all("SELECT id, status FROM orders");

  const resultado = [];
  for (const pedido of pedidos) {
    const pedidoMontado = await montarPedido(pedido.id);
    resultado.push(pedidoMontado);
  }

  return resultado;
}

/**
 * Deleta um pedido e seus itens
 * @param {number} pedidoId - ID do pedido
 * @throws {Error} Se pedido não existir
 */
async function deletarPedido(pedidoId) {
  await validarPedidoExistente(pedidoId);

  // Deletar items do pedido primeiro (FK constraint)
  await db.run("DELETE FROM order_items WHERE order_id = ?", [pedidoId]);

  // Depois deletar o pedido
  await db.run("DELETE FROM orders WHERE id = ?", [pedidoId]);
}

// ============================================================================
// AUXILIARES
// ============================================================================

/**
 * Monta um pedido completo com itens, total e data
 * @param {number} pedidoId - ID do pedido
 * @returns {Object} Pedido com estrutura { id, status, itens, total, data }
 */
async function montarPedido(pedidoId) {
  const pedido = await db.get(
    "SELECT id, status, created_at FROM orders WHERE id = ?",
    [pedidoId],
  );

  const itens = await db.all(
    `SELECT oi.product_id as produtoId, p.nome, p.preco, oi.quantidade
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [pedidoId],
  );

  const total = calcularTotal(itens);

  return {
    id: pedido.id,
    status: pedido.status,
    itens,
    data: pedido.created_at,
    total,
  };
}

/**
 * Calcula o total do pedido (soma de preço × quantidade)
 * @param {Array} itens - Array de itens com preco e quantidade
 * @returns {number} Total com 2 casas decimais
 */
function calcularTotal(itens) {
  const total = itens.reduce((soma, item) => {
    const itemTotal = (item.preco || 0) * (item.quantidade || 0);
    return soma + itemTotal;
  }, 0);

  return parseFloat(total.toFixed(2));
}

module.exports = {
  criarPedido,
  adicionarItem,
  finalizarPedido,
  listarPedidos,
  deletarPedido,
};
