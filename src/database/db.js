const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL
  )`);

  // Ensure created_at column exists (older DB files may lack it)
  const cols = await all("PRAGMA table_info('orders')");
  const hasCreatedAt = cols.some((c) => c.name === "created_at");
  if (!hasCreatedAt) {
    try {
      // Add column without non-constant default (some SQLite versions disallow it)
      await run("ALTER TABLE orders ADD COLUMN created_at DATETIME");
      // Backfill existing rows with the current timestamp
      await run(
        "UPDATE orders SET created_at = datetime('now') WHERE created_at IS NULL",
      );
    } catch (err) {
      // If ALTER fails for any reason, log and continue; queries that select created_at should handle missing column.
      console.error(
        "Não foi possível adicionar coluna created_at:",
        err.message || err,
      );
    }
  }

  await run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
}

module.exports = {
  db,
  run,
  get,
  all,
  init,
};
