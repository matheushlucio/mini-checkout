const { Router } = require('express');
const pedidoService = require('../services/pedidoService');

const router = Router();

/**
 * GET /api/v2/pedidos
 * Passo 5 — endpoint versionado com estrutura padronizada
 * Query params: status, clienteId
 */
router.get('/pedidos', (req, res) => {
  const STATUS_VALIDOS = ['ABERTO', 'FINALIZADO', 'CANCELADO'];
  const { status, clienteId } = req.query;

  if (status && !STATUS_VALIDOS.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Status inválido. Use: ABERTO, FINALIZADO ou CANCELADO.',
      error: { code: 'VALIDATION_ERROR' }
    });
  }

  try {
    const pedidos = pedidoService.listarPedidos({
      status: status ? status.toUpperCase() : undefined,
      clienteId
    });

    const data = pedidos.map(p => ({
      id: p.id,
      status: p.status,
      cliente: p.cliente,
      itens: p.itens,
      subtotal: p.subtotal,
      desconto: p.desconto,
      totalFinal: p.totalFinal,
      enderecoEntrega: p.enderecoEntrega,
      historico: p.historico,
      criadoEm: p.criadoEm
    }));

    return res.status(200).json({
      success: true,
      message: 'Pedidos listados com sucesso.',
      data
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar pedidos.',
      error: { code: 'INTERNAL_ERROR' }
    });
  }
});

module.exports = router;
