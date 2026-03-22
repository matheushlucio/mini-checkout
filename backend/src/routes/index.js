const { Router } = require('express');
const produtoController = require('../controllers/produtoController');
const clienteController = require('../controllers/clienteController');
const pedidoController  = require('../controllers/pedidoController');
const logController     = require('../controllers/logController');

const router = Router();

// ─── Produtos ────────────────────────────────────────────────────────────────
router.get('/produtos',    produtoController.listar);
router.post('/produtos',   produtoController.cadastrar);

// ─── Clientes ────────────────────────────────────────────────────────────────
router.get('/clientes',    clienteController.listar);
router.post('/clientes',   clienteController.cadastrar);

// ─── Pedidos ─────────────────────────────────────────────────────────────────
router.get('/pedidos',                pedidoController.listar);
router.post('/pedidos',               pedidoController.criar);
router.post('/pedidos/:id/itens',     pedidoController.adicionarItem);
router.post('/pedidos/:id/cupom',     pedidoController.aplicarCupom);
router.post('/pedidos/:id/finalizar', pedidoController.finalizar);
router.post('/pedidos/:id/cancelar',  pedidoController.cancelar);

// ─── Cupons ──────────────────────────────────────────────────────────────────
router.get('/cupons', pedidoController.listarCupons);

// ─── Logs ────────────────────────────────────────────────────────────────────
router.get('/logs', logController.listar);

module.exports = router;
