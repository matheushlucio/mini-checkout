const request = require('supertest');
const app = require('../src/app');

describe('Pedidos API', () => {
  it('deve criar um pedido', async () => {
    const response = await request(app).post('/pedidos');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('ABERTO');
  });

  it('deve adicionar item ao pedido', async () => {
    // cria produto
    const produto = await request(app)
      .post('/produtos')
      .send({ nome: 'Produto Pedido', preco: 50 });

    // cria pedido
    const pedido = await request(app).post('/pedidos');

    // adiciona item
    const response = await request(app)
      .post(`/pedidos/${pedido.body.id}/itens`)
      .send({
        produtoId: produto.body.id,
        quantidade: 2
      });

    expect(response.status).toBe(200);
    expect(response.body.mensagem).toBeDefined();
  });

  it('deve finalizar um pedido', async () => {
    const pedido = await request(app).post('/pedidos');

    const response = await request(app)
      .post(`/pedidos/${pedido.body.id}/finalizar`);

    expect(response.status).toBe(200);
    expect(response.body.mensagem).toBeDefined();
  });

  it('deve listar pedidos', async () => {
    const response = await request(app).get('/pedidos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
