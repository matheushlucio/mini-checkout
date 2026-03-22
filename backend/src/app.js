const express = require('express');
const cors    = require('cors');
const path    = require('path');

const loggerMiddleware  = require('./middlewares/logger');
const { errorMiddleware } = require('./middlewares/response');
const v1Routes          = require('./routes/index');
const v2Routes          = require('./routes/v2');

const app = express();

// ─── Middlewares globais ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// ─── Servir front-end estático ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../frontend')));

// ─── Rotas da API ────────────────────────────────────────────────────────────
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Atalhos sem versão (compatibilidade com passo 1)
app.use('/api', v1Routes);

// ─── Tratamento de erros ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
