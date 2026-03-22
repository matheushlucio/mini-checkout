const { registrarLog } = require('../services/logService');

// Middleware que registra cada requisição na tblLogs
function loggerMiddleware(req, res, next) {
  const inicio = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconhecido';

  // intercepta o método json() para capturar a resposta
  const originalJson = res.json.bind(res);
  let respostaCapturada = null;

  res.json = function (body) {
    respostaCapturada = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    const mensagemErro = respostaCapturada?.success === false ? respostaCapturada.message : null;

    registrarLog({
      rota: req.path,
      metodo: req.method,
      statusCode: res.statusCode,
      parametros: Object.keys(req.params).length ? req.params : null,
      body: req.method !== 'GET' ? req.body : null,
      resposta: respostaCapturada,
      usuarioId: null, // pode ser expandido com autenticação futura
      ip,
      mensagemErro,
      duracao
    });

    // Log no console para observabilidade imediata
    const cor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${cor}[${req.method}] ${req.path} → ${res.statusCode} (${duracao}ms)\x1b[0m`);
  });

  next();
}

module.exports = loggerMiddleware;
