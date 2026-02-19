const express = require('express');
const router = express.Router();

const pedidosController = require('../controllers/pedidosController');

router.post('/pedidos', pedidosController.criarPedido);
router.post('/pedidos/:id/itens', pedidosController.adicionarItem);
router.post('/pedidos/:id/finalizar', pedidosController.finalizarPedido);
router.get('/pedidos', pedidosController.listarPedidos);
router.delete('/pedidos/:id', pedidosController.deletarPedido);


module.exports = router;
