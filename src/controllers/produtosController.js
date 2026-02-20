const produtosService = require("../services/produtosService");

// ============================================================================
// CONTROLADOR DE PRODUTOS
// Responsável por: validações de entrada, chamadas ao serviço e respostas HTTP
// ============================================================================

/**
 * POST /produtos
 * Cria um novo produto
 * @param {Object} req - Request body deve conter { nome, preco }
 * @param {Object} res - Response HTTP
 */
async function criarProduto(req, res) {
  try {
    const { nome, preco } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "Nome é obrigatório" });
    }

    if (preco == null || isNaN(preco) || preco <= 0) {
      return res.status(400).json({
        erro: "Preço não pode ser negativo ou zero",
      });
    }

    const produtoCriado = await produtosService.criarProduto(nome, preco);
    res.status(201).json(produtoCriado);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

/**
 * GET /produtos
 * Lista todos os produtos
 */
async function listarProdutos(req, res) {
  try {
    const produtos = await produtosService.listarProdutos();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

/**
 * DELETE /produtos/:id
 * Deleta um produto pelo ID
 */
async function deletarProduto(req, res) {
  const idProduto = Number(req.params.id);

  try {
    await produtosService.deletarProduto(idProduto);
    res.json({ mensagem: "Produto deletado com sucesso" });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = {
  criarProduto,
  listarProdutos,
  deletarProduto,
};
