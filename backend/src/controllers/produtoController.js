const produtoService = require('../services/produtoService');
const { success, created, error } = require('../middlewares/response');

function listar(req, res, next) {
  try {
    const { nome } = req.query;
    const produtos = produtoService.listarProdutos(nome);
    return success(res, produtos, 'Produtos listados com sucesso.');
  } catch (e) { next(e); }
}

function cadastrar(req, res, next) {
  try {
    const produto = produtoService.cadastrarProduto(req.body);
    return created(res, produto, 'Produto cadastrado com sucesso.');
  } catch (e) { next(e); }
}

module.exports = { listar, cadastrar };
