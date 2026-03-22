const { listarLogs } = require('../services/logService');
const { success } = require('../middlewares/response');

function listar(req, res, next) {
  try {
    const limite = Math.min(Number(req.query.limite) || 100, 500);
    const logs = listarLogs({ limite });
    return success(res, logs, 'Logs listados com sucesso.');
  } catch (e) { next(e); }
}

module.exports = { listar };
