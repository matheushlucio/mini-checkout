const clientesService = require("../services/clientesService");

async function criarCliente(req, res) {
  try {
    const { nome, email } = req.body;

    const cliente = await clientesService.criarCliente(nome, email);

    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listarClientes(req, res) {
  try {
    const clientes = await clientesService.listarClientes();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function buscarCliente(req, res) {
  try {
    const { id } = req.params;

    const cliente = await clientesService.buscarCliente(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  criarCliente,
  listarClientes,
  buscarCliente,
};