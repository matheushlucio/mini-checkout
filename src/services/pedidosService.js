const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../database/data.json");

function lerDados() {
  const data = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(data);
}

function salvarDados(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// CRIAR PEDIDO
function criarPedido(itens) {
  const data = lerDados();

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    throw new Error("Pedido deve ter pelo menos um item");
  }

  const maiorId =
    data.pedidos.length > 0 ? Math.max(...data.pedidos.map((p) => p.id)) : 0;

  const novoId = maiorId + 1;

  const novoPedido = {
    id: novoId,
    itens: [],
    status: "ABERTO",
  };

  itens.forEach((item) => {
    const produto = data.produtos.find((p) => p.id === item.produtoId);

    if (!produto) {
      throw new Error("Produto não encontrado");
    }

    if (item.quantidade <= 0) {
      throw new Error("Quantidade inválida");
    }

    novoPedido.itens.push({
      produtoId: item.produtoId,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: item.quantidade,
    });
  });

  data.pedidos.push(novoPedido);
  salvarDados(data);

  return novoPedido;
}

// ADICIONAR ITEM
function adicionarItem(pedidoId, produtoId, quantidade) {
  const data = lerDados();

  const pedido = data.pedidos.find((p) => p.id === pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado");

  if (pedido.status === "FINALIZADO") {
    throw new Error("Pedido já finalizado");
  }

  const produto = data.produtos.find((p) => p.id === produtoId);
  if (!produto) throw new Error("Produto não encontrado");

  if (quantidade <= 0) throw new Error("Quantidade inválida");

  pedido.itens.push({
    produtoId: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    quantidade,
  });

  salvarDados(data);
}

// FINALIZAR PEDIDO
function finalizarPedido(pedidoId) {
  const data = lerDados();

  const pedido = data.pedidos.find((p) => p.id === pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado");

  pedido.status = "FINALIZADO";
  salvarDados(data);
}

// LISTAR PEDIDOS
function listarPedidos() {
  const data = lerDados();

  return data.pedidos.map((pedido) => {
    const total = pedido.itens.reduce(
      (soma, item) => soma + item.preco * item.quantidade,
      0,
    );

    return {
      ...pedido,
      total,
    };
  });
}

function deletarPedido(id) {
  const data = lerDados();

  const index = data.pedidos.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error("Pedido não encontrado");
  }

  data.pedidos.splice(index, 1);
  salvarDados(data);
}

module.exports = {
  criarPedido,
  adicionarItem,
  finalizarPedido,
  listarPedidos,
  deletarPedido,
};
