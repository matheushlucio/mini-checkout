const { limparBanco, closeDb } = require('./setup');

// Funções que carregam os services frescos após limpar o banco
function getServices() {
  return {
    produtoService: require('../src/services/produtoService'),
    pedidoService:  require('../src/services/pedidoService'),
    clienteService: require('../src/services/clienteService'),
  };
}

beforeEach(() => {
  limparBanco();
});
afterAll(closeDb);

// ─── Teste 1: Cálculo correto do total ───────────────────────────────────────
describe('Regra: cálculo do total do pedido', () => {
  it('calcula total = soma(preço × quantidade) corretamente', () => {
    const { produtoService, pedidoService } = getServices();
    const p1 = produtoService.cadastrarProduto({ nome: 'Produto A', preco: 10 });
    const p2 = produtoService.cadastrarProduto({ nome: 'Produto B', preco: 25 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p1.id, quantidade: 2 });
    pedidoService.adicionarItem(pedido.id, { produtoId: p2.id, quantidade: 3 });
    const atualizado = pedidoService.buscarPedidoPorId(pedido.id);
    // 2×10 + 3×25 = 20 + 75 = 95
    expect(atualizado.subtotal).toBe(95);
    expect(atualizado.totalFinal).toBe(95);
  });

  it('aplica cupom percentual e recalcula total corretamente', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Produto X', preco: 100 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 1 });
    const comCupom = pedidoService.aplicarCupom(pedido.id, { codigoCupom: 'CUPOM10' });
    expect(comCupom.subtotal).toBe(100);
    expect(comCupom.desconto).toBe(10);
    expect(comCupom.totalFinal).toBe(90);
  });

  it('aplica cupom fixo e recalcula total corretamente', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Produto Y', preco: 50 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 2 });
    const comCupom = pedidoService.aplicarCupom(pedido.id, { codigoCupom: 'DESCONTO20' });
    expect(comCupom.subtotal).toBe(100);
    expect(comCupom.desconto).toBe(20);
    expect(comCupom.totalFinal).toBe(80);
  });
});

// ─── Teste 2: Validações ─────────────────────────────────────────────────────
describe('Regra: validação de dados de entrada', () => {
  it('rejeita produto com preço negativo', () => {
    const { produtoService } = getServices();
    expect(() => produtoService.cadastrarProduto({ nome: 'Ruim', preco: -5 })).toThrow();
  });

  it('rejeita produto sem nome', () => {
    const { produtoService } = getServices();
    expect(() => produtoService.cadastrarProduto({ nome: '', preco: 10 })).toThrow();
  });

  it('rejeita quantidade zero ao adicionar item', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Prod', preco: 5 });
    const pedido = pedidoService.criarPedido({});
    expect(() => pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 0 })).toThrow();
  });

  it('rejeita quantidade negativa ao adicionar item', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Prod2', preco: 5 });
    const pedido = pedidoService.criarPedido({});
    expect(() => pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: -3 })).toThrow();
  });
});

// ─── Teste 3: Pedido finalizado/cancelado ────────────────────────────────────
describe('Regra: pedido finalizado/cancelado', () => {
  it('pedido finalizado não aceita novos itens', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Item', preco: 20 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 1 });
    pedidoService.finalizarPedido(pedido.id);
    expect(() => pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 1 })).toThrow();
  });

  it('pedido cancelado não pode ser finalizado', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Item2', preco: 20 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 1 });
    pedidoService.cancelarPedido(pedido.id);
    expect(() => pedidoService.finalizarPedido(pedido.id)).toThrow();
  });

  it('pedido sem itens não pode ser finalizado', () => {
    const { pedidoService } = getServices();
    const pedido = pedidoService.criarPedido({});
    expect(() => pedidoService.finalizarPedido(pedido.id)).toThrow();
  });

  it('registra histórico de status corretamente', () => {
    const { produtoService, pedidoService } = getServices();
    const p = produtoService.cadastrarProduto({ nome: 'Hist', preco: 5 });
    const pedido = pedidoService.criarPedido({});
    pedidoService.adicionarItem(pedido.id, { produtoId: p.id, quantidade: 1 });
    const finalizado = pedidoService.finalizarPedido(pedido.id);
    expect(finalizado.historico.length).toBeGreaterThanOrEqual(2);
    expect(finalizado.historico[0].status).toBe('ABERTO');
    expect(finalizado.historico[1].status).toBe('FINALIZADO');
  });
});

// ─── Teste 4: Clientes ───────────────────────────────────────────────────────
describe('Regra: cadastro de clientes', () => {
  it('cadastra e associa cliente a pedido', () => {
    const { clienteService, pedidoService } = getServices();
    const cliente = clienteService.cadastrarCliente({ nome: 'João', email: 'joao@test.com' });
    const pedido  = pedidoService.criarPedido({ clienteId: cliente.id });
    expect(pedido.cliente.id).toBe(cliente.id);
    expect(pedido.cliente.nome).toBe('João');
  });

  it('rejeita e-mail duplicado', () => {
    const { clienteService } = getServices();
    clienteService.cadastrarCliente({ nome: 'Ana', email: 'ana@test.com' });
    expect(() => clienteService.cadastrarCliente({ nome: 'Ana2', email: 'ana@test.com' })).toThrow();
  });
});
