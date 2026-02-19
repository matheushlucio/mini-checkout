const request = require('supertest');
const app = require('../src/app');

describe('Produtos API', () => {
  it('deve criar um produto', async () => {
    const response = await request(app)
      .post('/produtos')
      .send({
        nome: 'Produto Teste',
        preco: 100
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.nome).toBe('Produto Teste');
  });

  it('deve listar produtos', async () => {
    const response = await request(app).get('/produtos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
