const request = require('supertest');
const { limparBanco, closeDb } = require('./setup');

function getApp() {
  // Recarrega o app com banco limpo
  delete require.cache[require.resolve('../src/app')];
  return require('../src/app');
}

beforeEach(() => { limparBanco(); });
afterAll(closeDb);

// ─── Produtos ────────────────────────────────────────────────────────────────
describe('API: POST /api/v1/produtos', () => {
  it('cria produto e retorna 201', async () => {
    const res = await request(getApp()).post('/api/v1/produtos').send({ nome: 'Camiseta', preco: 49.90 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nome).toBe('Camiseta');
    expect(res.body.data.preco).toBe(49.90);
  });

  it('retorna 400 ao criar produto com preço negativo', async () => {
    const res = await request(getApp()).post('/api/v1/produtos').send({ nome: 'Ruim', preco: -10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 400 ao criar produto sem nome', async () => {
    const res = await request(getApp()).post('/api/v1/produtos').send({ nome: '', preco: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('API: GET /api/v1/produtos', () => {
  it('lista produtos cadastrados', async () => {
    const app = getApp();
    await request(app).post('/api/v1/produtos').send({ nome: 'Calça', preco: 89 });
    await request(app).post('/api/v1/produtos').send({ nome: 'Tênis', preco: 199 });
    const res = await request(app).get('/api/v1/produtos');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('busca produto por nome', async () => {
    const app = getApp();
    await request(app).post('/api/v1/produtos').send({ nome: 'Mochila Escolar', preco: 120 });
    const res = await request(app).get('/api/v1/produtos?nome=Mochila');
    expect(res.status).toBe(200);
    expect(res.body.data[0].nome).toBe('Mochila Escolar');
  });
});

// ─── Pedidos ─────────────────────────────────────────────────────────────────
describe('API: POST /api/v1/pedidos', () => {
  it('cria pedido com status ABERTO', async () => {
    const res = await request(getApp()).post('/api/v1/pedidos').send({});
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ABERTO');
  });

  it('cria pedido com cliente e endereço', async () => {
    const app = getApp();
    const cliRes = await request(app).post('/api/v1/clientes').send({ nome: 'Maria', email: 'maria@test.com' });
    const res = await request(app).post('/api/v1/pedidos').send({
      clienteId: cliRes.body.data.id,
      enderecoEntrega: { rua: 'Av. Brasil', numero: '100', bairro: 'Centro', cidade: 'Rondonópolis' }
    });
    expect(res.status).toBe(201);
    expect(res.body.data.cliente.nome).toBe('Maria');
    expect(res.body.data.enderecoEntrega.cidade).toBe('Rondonópolis');
  });
});

describe('API: POST /api/v1/pedidos/:id/itens', () => {
  it('adiciona item ao pedido', async () => {
    const app = getApp();
    const prodRes = await request(app).post('/api/v1/produtos').send({ nome: 'Notebook', preco: 3000 });
    const pedRes  = await request(app).post('/api/v1/pedidos').send({});
    const res = await request(app)
      .post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`)
      .send({ produtoId: prodRes.body.data.id, quantidade: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(6000);
    expect(res.body.data.itens.length).toBe(1);
  });
});

describe('API: POST /api/v1/pedidos/:id/finalizar', () => {
  it('finaliza pedido com itens', async () => {
    const app = getApp();
    const prodRes = await request(app).post('/api/v1/produtos').send({ nome: 'Mouse', preco: 80 });
    const pedRes  = await request(app).post('/api/v1/pedidos').send({});
    await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`).send({ produtoId: prodRes.body.data.id, quantidade: 1 });
    const res = await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/finalizar`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('FINALIZADO');
  });

  it('retorna 400 ao tentar finalizar pedido sem itens', async () => {
    const app = getApp();
    const pedRes = await request(app).post('/api/v1/pedidos').send({});
    const res = await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/finalizar`);
    expect(res.status).toBe(400);
  });
});

// ─── Erros ───────────────────────────────────────────────────────────────────
describe('API: erros esperados', () => {
  it('retorna 404 ao adicionar item com produto inexistente', async () => {
    const app = getApp();
    const pedRes = await request(app).post('/api/v1/pedidos').send({});
    const res = await request(app)
      .post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`)
      .send({ produtoId: 9999, quantidade: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('retorna 400 ao adicionar item em pedido finalizado', async () => {
    const app = getApp();
    const prodRes = await request(app).post('/api/v1/produtos').send({ nome: 'HD', preco: 250 });
    const pedRes  = await request(app).post('/api/v1/pedidos').send({});
    await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`).send({ produtoId: prodRes.body.data.id, quantidade: 1 });
    await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/finalizar`);
    const res = await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`).send({ produtoId: prodRes.body.data.id, quantidade: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BUSINESS_RULE');
  });

  it('retorna 400 ao cancelar pedido finalizado', async () => {
    const app = getApp();
    const prodRes = await request(app).post('/api/v1/produtos').send({ nome: 'SSD', preco: 300 });
    const pedRes  = await request(app).post('/api/v1/pedidos').send({});
    await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/itens`).send({ produtoId: prodRes.body.data.id, quantidade: 1 });
    await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/finalizar`);
    const res = await request(app).post(`/api/v1/pedidos/${pedRes.body.data.id}/cancelar`);
    expect(res.status).toBe(400);
  });
});

// ─── API v2 ──────────────────────────────────────────────────────────────────
describe('API v2: GET /api/v2/pedidos', () => {
  it('lista pedidos com estrutura padronizada v2', async () => {
    const res = await request(getApp()).get('/api/v2/pedidos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filtra pedidos por status ABERTO', async () => {
    const app = getApp();
    await request(app).post('/api/v1/pedidos').send({});
    const res = await request(app).get('/api/v2/pedidos?status=ABERTO');
    expect(res.status).toBe(200);
    res.body.data.forEach(p => expect(p.status).toBe('ABERTO'));
  });

  it('retorna erro 400 para status inválido', async () => {
    const res = await request(getApp()).get('/api/v2/pedidos?status=INVALIDO');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── Desempenho ──────────────────────────────────────────────────────────────
describe('Desempenho: GET /api/v1/pedidos < 300ms', () => {
  it('responde em menos de 300ms (média de 10 chamadas)', async () => {
    const app = getApp();
    const tempos = [];
    for (let i = 0; i < 10; i++) {
      const t = Date.now();
      await request(app).get('/api/v1/pedidos');
      tempos.push(Date.now() - t);
    }
    const media = tempos.reduce((a,b) => a+b, 0) / tempos.length;
    console.log(`  ⏱  Média GET /pedidos: ${media.toFixed(1)}ms`);
    expect(media).toBeLessThan(300);
  });
});
