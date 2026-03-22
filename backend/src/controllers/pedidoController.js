const pedidoService = require('../services/pedidoService');
const { success, created } = require('../middlewares/response');

function listar(req, res, next) {
  try {
    const { status, clienteId } = req.query;
    const pedidos = pedidoService.listarPedidos({ status, clienteId });
    return success(res, pedidos, 'Pedidos listados com sucesso.');
  } catch (e) { next(e); }
}

function criar(req, res, next) {
  try {
    const pedido = pedidoService.criarPedido(req.body);
    return created(res, pedido, 'Pedido criado com sucesso.');
  } catch (e) { next(e); }
}

function adicionarItem(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = pedidoService.adicionarItem(Number(id), req.body);
    return success(res, pedido, 'Item adicionado com sucesso.');
  } catch (e) { next(e); }
}

function aplicarCupom(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = pedidoService.aplicarCupom(Number(id), req.body);
    return success(res, pedido, 'Cupom aplicado com sucesso.');
  } catch (e) { next(e); }
}

function finalizar(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = pedidoService.finalizarPedido(Number(id));
    return success(res, pedido, 'Pedido finalizado com sucesso.');
  } catch (e) { next(e); }
}

function cancelar(req, res, next) {
  try {
    const { id } = req.params;
    const pedido = pedidoService.cancelarPedido(Number(id));
    return success(res, pedido, 'Pedido cancelado com sucesso.');
  } catch (e) { next(e); }
}

function listarCupons(req, res, next) {
  try {
    const cupons = pedidoService.listarCupons();
    return success(res, cupons, 'Cupons listados com sucesso.');
  } catch (e) { next(e); }
}

module.exports = { listar, criar, adicionarItem, aplicarCupom, finalizar, cancelar, listarCupons };
