const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/clientesController');

router.post('/clientes', clientesController.criarCliente);
router.get('/clientes', clientesController.listarClientes);
router.get('/clientes/:id', clientesController.buscarCliente);

module.exports = router;