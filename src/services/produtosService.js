const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../database/data.json');

function lerDados() {
  const data = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(data);
}

function salvarDados(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function criarProduto(nome, preco) {
  const data = lerDados();

  const ultimoProduto = data.produtos[data.produtos.length - 1];
  const novoId = ultimoProduto ? ultimoProduto.id + 1 : 1;

  const novoProduto = {
    id: novoId,
    nome,
    preco
  };

  data.produtos.push(novoProduto);
  salvarDados(data);

  return novoProduto;
}

function listarProdutos() {
  const data = lerDados();
  return data.produtos;
}

function deletarProduto(id) {
  const data = lerDados();

  const index = data.produtos.findIndex(p => p.id === id);

  if (index === -1) {
    throw new Error('Produto não encontrado');
  }

  data.produtos.splice(index, 1);
  salvarDados(data);
}

module.exports = {
  criarProduto,
  listarProdutos,
  deletarProduto
};
