const express = require('express');
const path = require('path');

const produtosRoutes = require('./routes/produtos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const clientesRoutes = require('./routes/clientes.routes');

const tempoResposta = require('./middlewares/tempoResposta');

const app = express();

app.use(express.json());

// Servir arquivos estáticos (front-end)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de tempo
app.use(tempoResposta);

// Rotas
app.use(produtosRoutes);
app.use(pedidosRoutes);
app.use(clientesRoutes);

module.exports = app;
