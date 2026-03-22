const { getDb } = require('../database/db');
const { buscarProdutoPorId } = require('./produtoService');
const { buscarClientePorId } = require('./clienteService');

// ─── helpers ──────────────────────────────────────────────────────────────────

function _calcularSubtotal(pedidoId) {
  const db = getDb();
  const row = db.prepare(
    `SELECT COALESCE(SUM(quantidade * precoUnit), 0) AS sub FROM tblItensPedido WHERE pedidoId = ?`
  ).get(pedidoId);
  return row.sub;
}

function _registrarHistorico(db, pedidoId, status) {
  db.prepare(
    `INSERT INTO tblHistoricoStatus (pedidoId, status) VALUES (?, ?)`
  ).run(pedidoId, status);
}

function _pedidoCompleto(pedidoId) {
  const db = getDb();
  const pedido = db.prepare(`SELECT * FROM tblPedidos WHERE id = ?`).get(pedidoId);
  if (!pedido) return null;

  const itens = db.prepare(
    `SELECT i.*, p.nome AS nomeProduto
     FROM tblItensPedido i JOIN tblProdutos p ON p.id = i.produtoId
     WHERE i.pedidoId = ?`
  ).all(pedidoId);

  const cliente = pedido.clienteId
    ? db.prepare(`SELECT * FROM tblClientes WHERE id = ?`).get(pedido.clienteId)
    : null;

  const historico = db.prepare(
    `SELECT status, dataHora FROM tblHistoricoStatus WHERE pedidoId = ? ORDER BY id`
  ).all(pedidoId);

  const subtotal = _calcularSubtotal(pedidoId);
  const totalFinal = Math.max(0, subtotal - pedido.desconto);

  return {
    id: pedido.id,
    status: pedido.status,
    cliente: cliente ? { id: cliente.id, nome: cliente.nome, email: cliente.email } : null,
    itens: itens.map(i => ({
      id: i.id,
      produtoId: i.produtoId,
      nomeProduto: i.nomeProduto,
      quantidade: i.quantidade,
      precoUnit: i.precoUnit,
      totalItem: i.quantidade * i.precoUnit
    })),
    subtotal,
    desconto: pedido.desconto,
    totalFinal,
    enderecoEntrega: pedido.endRua ? {
      rua: pedido.endRua,
      numero: pedido.endNumero,
      bairro: pedido.endBairro,
      cidade: pedido.endCidade
    } : null,
    historico,
    criadoEm: pedido.criadoEm
  };
}

// ─── service functions ────────────────────────────────────────────────────────

function listarPedidos({ status, clienteId } = {}) {
  const db = getDb();
  let sql = `SELECT id FROM tblPedidos WHERE 1=1`;
  const params = [];
  if (status) { sql += ` AND status = ?`; params.push(status); }
  if (clienteId) { sql += ` AND clienteId = ?`; params.push(clienteId); }
  sql += ` ORDER BY id DESC`;

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => _pedidoCompleto(r.id));
}

function buscarPedidoPorId(id) {
  return _pedidoCompleto(id);
}

function criarPedido({ clienteId, enderecoEntrega }) {
  const db = getDb();

  if (clienteId) {
    const cliente = buscarClientePorId(clienteId);
    if (!cliente) throw { status: 404, code: 'NOT_FOUND', message: 'Cliente não encontrado.' };
  }

  // validar endereço se informado
  if (enderecoEntrega) {
    const { rua, numero, bairro, cidade } = enderecoEntrega;
    if (!rua || !numero || !bairro || !cidade) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Endereço deve conter: rua, numero, bairro, cidade.' };
    }
  }

  const result = db.prepare(
    `INSERT INTO tblPedidos (clienteId, endRua, endNumero, endBairro, endCidade)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    clienteId || null,
    enderecoEntrega?.rua || null,
    enderecoEntrega?.numero || null,
    enderecoEntrega?.bairro || null,
    enderecoEntrega?.cidade || null
  );

  _registrarHistorico(db, result.lastInsertRowid, 'ABERTO');
  return _pedidoCompleto(result.lastInsertRowid);
}

function adicionarItem(pedidoId, { produtoId, quantidade }) {
  const db = getDb();

  const pedido = db.prepare(`SELECT * FROM tblPedidos WHERE id = ?`).get(pedidoId);
  if (!pedido) throw { status: 404, code: 'NOT_FOUND', message: 'Pedido não encontrado.' };
  if (pedido.status !== 'ABERTO') {
    throw { status: 400, code: 'BUSINESS_RULE', message: `Pedido ${pedido.status} não pode receber novos itens.` };
  }

  const produto = buscarProdutoPorId(produtoId);
  if (!produto) throw { status: 404, code: 'NOT_FOUND', message: 'Produto não encontrado.' };

  if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Quantidade deve ser maior que zero.' };
  }

  db.prepare(
    `INSERT INTO tblItensPedido (pedidoId, produtoId, quantidade, precoUnit) VALUES (?, ?, ?, ?)`
  ).run(pedidoId, produtoId, Number(quantidade), produto.preco);

  return _pedidoCompleto(pedidoId);
}

function aplicarCupom(pedidoId, { codigoCupom }) {
  const db = getDb();

  const pedido = db.prepare(`SELECT * FROM tblPedidos WHERE id = ?`).get(pedidoId);
  if (!pedido) throw { status: 404, code: 'NOT_FOUND', message: 'Pedido não encontrado.' };
  if (pedido.status !== 'ABERTO') {
    throw { status: 400, code: 'BUSINESS_RULE', message: 'Cupom só pode ser aplicado em pedido ABERTO.' };
  }

  if (!codigoCupom) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Código do cupom é obrigatório.' };

  const cupom = db.prepare(`SELECT * FROM tblCupons WHERE codigo = ? AND ativo = 1`).get(codigoCupom.toUpperCase());
  if (!cupom) throw { status: 404, code: 'NOT_FOUND', message: 'Cupom inválido ou inativo.' };

  const subtotal = _calcularSubtotal(pedidoId);
  let desconto = 0;
  if (cupom.tipo === 'percentual') {
    desconto = subtotal * (cupom.valor / 100);
  } else {
    desconto = cupom.valor;
  }
  desconto = Math.min(desconto, subtotal); // desconto não pode ser maior que o subtotal

  db.prepare(`UPDATE tblPedidos SET cupomId = ?, desconto = ? WHERE id = ?`).run(cupom.id, desconto, pedidoId);
  return _pedidoCompleto(pedidoId);
}

function finalizarPedido(pedidoId) {
  const db = getDb();

  const pedido = db.prepare(`SELECT * FROM tblPedidos WHERE id = ?`).get(pedidoId);
  if (!pedido) throw { status: 404, code: 'NOT_FOUND', message: 'Pedido não encontrado.' };
  if (pedido.status === 'FINALIZADO') throw { status: 400, code: 'BUSINESS_RULE', message: 'Pedido já finalizado.' };
  if (pedido.status === 'CANCELADO') throw { status: 400, code: 'BUSINESS_RULE', message: 'Pedido cancelado não pode ser finalizado.' };

  const itens = db.prepare(`SELECT id FROM tblItensPedido WHERE pedidoId = ?`).all(pedidoId);
  if (itens.length === 0) throw { status: 400, code: 'BUSINESS_RULE', message: 'Pedido sem itens não pode ser finalizado.' };

  db.prepare(`UPDATE tblPedidos SET status = 'FINALIZADO' WHERE id = ?`).run(pedidoId);
  _registrarHistorico(db, pedidoId, 'FINALIZADO');
  return _pedidoCompleto(pedidoId);
}

function cancelarPedido(pedidoId) {
  const db = getDb();

  const pedido = db.prepare(`SELECT * FROM tblPedidos WHERE id = ?`).get(pedidoId);
  if (!pedido) throw { status: 404, code: 'NOT_FOUND', message: 'Pedido não encontrado.' };
  if (pedido.status === 'CANCELADO') throw { status: 400, code: 'BUSINESS_RULE', message: 'Pedido já cancelado.' };
  if (pedido.status === 'FINALIZADO') throw { status: 400, code: 'BUSINESS_RULE', message: 'Pedido finalizado não pode ser cancelado.' };

  db.prepare(`UPDATE tblPedidos SET status = 'CANCELADO' WHERE id = ?`).run(pedidoId);
  _registrarHistorico(db, pedidoId, 'CANCELADO');
  return _pedidoCompleto(pedidoId);
}

function listarCupons() {
  return getDb().prepare(`SELECT * FROM tblCupons WHERE ativo = 1`).all();
}

module.exports = {
  listarPedidos,
  buscarPedidoPorId,
  criarPedido,
  adicionarItem,
  aplicarCupom,
  finalizarPedido,
  cancelarPedido,
  listarCupons
};
