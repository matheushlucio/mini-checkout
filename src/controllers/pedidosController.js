const pedidosService = require("../services/pedidosService");

// ============================================================================
// CONTROLADOR DE PEDIDOS
// Responsável por: validações de entrada, chamadas ao serviço e respostas HTTP
// ============================================================================

/**
 * POST /pedidos
 * Cria um novo pedido automaticamente com status ABERTO
 * @param {Object} req - Request (body opcional, não utilizado)
 * @param {Object} res - Response HTTP
 */
async function criarPedido(req, res) {
  try {
    const pedido = await pedidosService.criarPedido();
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

/**
 * POST /pedidos/:id/itens
 * Adiciona um item a um pedido aberto
 * @param {Object} req - URL param: id | Body deve conter { produtoId, quantidade }
 * @param {Object} res - Response HTTP
 */
async function adicionarItem(req, res) {
  const pedidoId = Number(req.params.id);
  const { produtoId, quantidade } = req.body;

  // Validação: ID do produto
  if (!produtoId || isNaN(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido" });
  }

  // Validação: Quantidade
  if (quantidade == null || isNaN(quantidade) || quantidade <= 0) {
    return res.status(400).json({
      erro: "Quantidade não pode ser zero ou negativa",
    });
  }

  try {
    await pedidosService.adicionarItem(pedidoId, produtoId, quantidade);
    res.json({ mensagem: "Item adicionado com sucesso" });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

/**
 * POST /pedidos/:id/finalizar
 * Finaliza um pedido (bloqueia adição de novos itens)
 * @param {Object} req - URL param: id
 * @param {Object} res - Response HTTP
 */
async function finalizarPedido(req, res) {
  const pedidoId = Number(req.params.id);

  try {
    await pedidosService.finalizarPedido(pedidoId);
    res.json({ mensagem: "Pedido finalizado com sucesso" });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

/**
 * GET /pedidos
 * Lista todos os pedidos com seus itens
 */
async function listarPedidos(req, res) {
  try {
    const pedidos = await pedidosService.listarPedidos();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

/**
 * DELETE /pedidos/:id
 * Deleta um pedido pelo ID
 */
async function deletarPedido(req, res) {
  const pedidoId = Number(req.params.id);

  try {
    await pedidosService.deletarPedido(pedidoId);
    res.json({ mensagem: "Pedido deletado com sucesso" });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = {
  criarPedido,
  adicionarItem,
  finalizarPedido,
  listarPedidos,
  deletarPedido,
};
