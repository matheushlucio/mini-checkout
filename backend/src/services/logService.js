const { getDb } = require('../database/db');

function registrarLog({
  rota, metodo, statusCode,
  parametros, body, resposta,
  usuarioId, ip, mensagemErro, duracao
}) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO tblLogs
        (rota, metodo, statusCode, parametros, body, resposta, usuarioId, ip, mensagemErro, duracao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rota,
      metodo,
      statusCode || null,
      parametros ? JSON.stringify(parametros) : null,
      body ? JSON.stringify(body) : null,
      resposta ? JSON.stringify(resposta) : null,
      usuarioId || null,
      ip || null,
      mensagemErro || null,
      duracao || null
    );
  } catch (e) {
    // Nunca deixar falha de log quebrar a aplicação
    console.error('[LOG ERROR]', e.message);
  }
}

function listarLogs({ limite = 100 } = {}) {
  return getDb().prepare(`SELECT * FROM tblLogs ORDER BY id DESC LIMIT ?`).all(limite);
}

module.exports = { registrarLog, listarLogs };
