const pedidosService = require('../services/pedidosService');

function criarPedido(req, res) {
  try {
    const pedido = pedidosService.criarPedido(req.body.itens);
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}


// POST /pedidos/:id/itens
function adicionarItem(req, res) {
  const pedidoId = Number(req.params.id);
  const { produtoId, quantidade } = req.body;

  try {
    pedidosService.adicionarItem(pedidoId, produtoId, quantidade);
    res.json({ mensagem: 'Item adicionado com sucesso' });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

// POST /pedidos/:id/finalizar
function finalizarPedido(req, res) {
  const pedidoId = Number(req.params.id);

  try {
    pedidosService.finalizarPedido(pedidoId);
    res.json({ mensagem: 'Pedido finalizado com sucesso' });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

// GET /pedidos
function listarPedidos(req, res) {
  const pedidos = pedidosService.listarPedidos();
  res.json(pedidos);
}

function deletarPedido(req, res) {
  const id = Number(req.params.id);

  try {
    pedidosService.deletarPedido(id);
    res.json({ mensagem: 'Pedido deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = {
  criarPedido,
  adicionarItem,
  finalizarPedido,
  listarPedidos,
  deletarPedido
};
