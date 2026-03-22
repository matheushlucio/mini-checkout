const clienteService = require('../services/clienteService');
const { success, created } = require('../middlewares/response');

function listar(req, res, next) {
  try {
    const clientes = clienteService.listarClientes();
    return success(res, clientes, 'Clientes listados com sucesso.');
  } catch (e) { next(e); }
}

function cadastrar(req, res, next) {
  try {
    const cliente = clienteService.cadastrarCliente(req.body);
    return created(res, cliente, 'Cliente cadastrado com sucesso.');
  } catch (e) { next(e); }
}

module.exports = { listar, cadastrar };
