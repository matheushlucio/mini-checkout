# Mini Checkout API

API desenvolvida em Node.js para simular um fluxo básico de checkout, aplicada à disciplina de Qualidade de Software.

## Tecnologias Utilizadas
- Node.js
- Express
- Persistência em arquivo JSON
- Jest
- Supertest

## Como executar o projeto
npm install
npm run dev

Rotas da API

Produtos
POST /produtos
GET /produtos

Pedidos
POST /pedidos
POST /pedidos/:id/itens
POST /pedidos/:id/finalizar
GET /pedidos

Testes Automatizados
Para executar os testes:
npm test
