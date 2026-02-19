const produtosService = require('../services/produtosService');

// POST /produtos
function criarProduto(req, res) {
  const { nome, preco } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  if (preco == null || preco < 0) {
    return res.status(400).json({ erro: 'Preço inválido' });
  }

  const produto = produtosService.criarProduto(nome, preco);
  res.status(201).json(produto);
}

// GET /produtos
function listarProdutos(req, res) {
  const produtos = produtosService.listarProdutos();
  res.json(produtos);
}

function deletarProduto(req, res) {
  const id = Number(req.params.id);

  try {
    produtosService.deletarProduto(id);
    res.json({ mensagem: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = {
  criarProduto,
  listarProdutos,
  deletarProduto
};

