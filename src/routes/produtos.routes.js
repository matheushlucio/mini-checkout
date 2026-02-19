const express = require('express');
const router = express.Router();

const produtosController = require('../controllers/produtosController');

router.post('/produtos', produtosController.criarProduto);
router.get('/produtos', produtosController.listarProdutos);
router.delete('/produtos/:id', produtosController.deletarProduto);


module.exports = router;
