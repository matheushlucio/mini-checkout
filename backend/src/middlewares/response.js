// ─── Padronização de respostas ────────────────────────────────────────────────

function success(res, data, message = 'Operação realizada com sucesso.', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function created(res, data, message = 'Recurso criado com sucesso.') {
  return success(res, data, message, 201);
}

function error(res, message, code = 'ERROR', statusCode = 500, details = null) {
  const body = { success: false, message, error: { code } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

// ─── Middleware de erros global ───────────────────────────────────────────────

function errorMiddleware(err, req, res, next) {
  // erros de negócio lançados como objetos
  if (err.status && err.code) {
    return error(res, err.message, err.code, err.status);
  }

  // erros não esperados
  console.error('[UNHANDLED ERROR]', err);
  return error(res, 'Erro interno do servidor.', 'INTERNAL_ERROR', 500);
}

module.exports = { success, created, error, errorMiddleware };
