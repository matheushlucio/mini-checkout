const path = require('path');
const fs   = require('fs');

const TEST_DB = path.join(__dirname, '../data/test.json');
process.env.DB_PATH = TEST_DB;

function limparBanco() {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  // Limpa cache de todos os módulos relacionados ao banco
  Object.keys(require.cache).forEach(key => {
    if (key.includes('database') || key.includes('Service') || key.includes('service')) {
      delete require.cache[key];
    }
  });
}

function closeDb() {
  try {
    const { closeDb } = require('../src/database/db');
    closeDb();
  } catch(_) {}
}

module.exports = { limparBanco, closeDb };
