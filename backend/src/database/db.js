/**
 * db.js — Banco de dados usando arquivo JSON puro
 * Zero dependências nativas. Funciona em Windows, Mac e Linux.
 */

const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/checkout.json');

let store = null;

const CUPONS_PADRAO = [
  { id: 1, codigo: 'CUPOM10',    tipo: 'percentual', valor: 10, ativo: 1 },
  { id: 2, codigo: 'DESCONTO20', tipo: 'fixo',       valor: 20, ativo: 1 },
  { id: 3, codigo: 'FRETE15',    tipo: 'percentual', valor: 15, ativo: 1 },
];

// ─── Persistência ─────────────────────────────────────────────────────────────
function salvar() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
  } catch(e) { console.error('[DB] Erro ao salvar:', e.message); }
}

function carregar() {
  if (fs.existsSync(DB_PATH)) {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
    catch(e) { console.error('[DB] Arquivo corrompido, recriando.'); }
  }
  return null;
}

function nextId(tabela) {
  if (!store._seq) store._seq = {};
  if (!store._seq[tabela]) {
    // Começa pelo maior id existente
    const rows = store[tabela] || [];
    store._seq[tabela] = rows.length ? Math.max(...rows.map(r => r.id || 0)) : 0;
  }
  store._seq[tabela] += 1;
  return store._seq[tabela];
}

function agora() {
  const d = new Date();
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ─── Operações diretas no store (usadas pelos services) ───────────────────────

const ops = {
  inserir(tabela, dados) {
    if (!store[tabela]) store[tabela] = [];
    const id = nextId(tabela);
    const row = { id, ...dados };
    // timestamps default
    if (['tblProdutos','tblClientes','tblCupons','tblPedidos'].includes(tabela) && !row.criadoEm) {
      row.criadoEm = agora();
    }
    if (['tblHistoricoStatus','tblLogs'].includes(tabela) && !row.dataHora) {
      row.dataHora = agora();
    }
    store[tabela].push(row);
    salvar();
    return row;
  },

  atualizar(tabela, id, campos) {
    const rows = store[tabela] || [];
    const idx = rows.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return null;
    Object.assign(rows[idx], campos);
    salvar();
    return rows[idx];
  },

  buscarPorId(tabela, id) {
    return (store[tabela] || []).find(r => String(r.id) === String(id)) || null;
  },

  buscarUm(tabela, filtro) {
    return (store[tabela] || []).find(r => _match(r, filtro)) || null;
  },

  listar(tabela, filtro, opts = {}) {
    let rows = (store[tabela] || []).filter(r => _match(r, filtro));
    if (opts.orderBy) {
      const campo = opts.orderBy;
      const desc  = opts.desc || false;
      rows = rows.slice().sort((a, b) => {
        if (a[campo] < b[campo]) return desc ? 1 : -1;
        if (a[campo] > b[campo]) return desc ? -1 : 1;
        return 0;
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  },

  somarProduto(tabela, campoProd, campoQtd, filtro) {
    return (store[tabela] || [])
      .filter(r => _match(r, filtro))
      .reduce((acc, r) => acc + (Number(r[campoProd]) || 0) * (Number(r[campoQtd]) || 0), 0);
  }
};

function _match(row, filtro = {}) {
  return Object.entries(filtro).every(([k, v]) => {
    if (v === undefined) return true;
    if (typeof v === 'string' && v.startsWith('%') && v.endsWith('%')) {
      return String(row[k] || '').toLowerCase().includes(v.slice(1,-1).toLowerCase());
    }
    return String(row[k]) === String(v);
  });
}

// ─── Interface compatível com better-sqlite3 (prepare/run/get/all) ────────────
// Essa camada traduz as queries SQL dos services para chamadas às ops acima.

function _parseSql(sql, params) {
  const s = sql.replace(/\s+/g, ' ').trim();
  let pi = 0;
  const p = () => params[pi++];

  // ── INSERT ──
  const ins = s.match(/^INSERT (?:OR IGNORE )?INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (ins) {
    const tabela  = ins[1];
    const colunas = ins[2].split(',').map(c => c.trim()).filter(c => c !== 'id');
    const dados   = {};
    colunas.forEach(col => { dados[col] = params[pi++]; });

    // defaults
    if (tabela === 'tblPedidos') {
      if (!dados.status)           dados.status   = 'ABERTO';
      if (dados.desconto == null)  dados.desconto = 0;
    }
    if (tabela === 'tblCupons' && dados.ativo == null) dados.ativo = 1;

    // OR IGNORE: checa unicidade
    if (/OR IGNORE/i.test(s) && tabela === 'tblCupons') {
      const existe = ops.buscarUm('tblCupons', { codigo: dados.codigo });
      if (existe) return { type: 'insert', lastInsertRowid: existe.id };
    }

    const row = ops.inserir(tabela, dados);
    return { type: 'insert', lastInsertRowid: row.id };
  }

  // ── UPDATE simples: UPDATE tbl SET a=?,b=? WHERE id=? ──
  const upd = s.match(/^UPDATE (\w+) SET (.+?) WHERE (\w+)\s*=\s*\?$/i);
  if (upd) {
    const tabela    = upd[1];
    const setClausa = upd[2];
    const whereCol  = upd[3];
    const setParts  = setClausa.split(',').map(p => p.trim());
    const campos    = {};
    setParts.forEach(part => {
      const col = part.split('=')[0].trim();
      campos[col] = params[pi++];
    });
    const whereVal = params[pi++];
    const rows = store[tabela] || [];
    rows.forEach(r => {
      if (String(r[whereCol]) === String(whereVal)) Object.assign(r, campos);
    });
    salvar();
    return { type: 'update', changes: 1 };
  }

  // ── SELECT com SUM ──
  if (/COALESCE\s*\(\s*SUM/i.test(s)) {
    // SELECT COALESCE(SUM(quantidade * precoUnit), 0) AS sub FROM tblItensPedido WHERE pedidoId = ?
    const m = s.match(/FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
    if (m) {
      const tabela   = m[1];
      const whereCol = m[2];
      const whereVal = params[0];
      const rows = (store[tabela] || []).filter(r => String(r[whereCol]) === String(whereVal));
      const total = rows.reduce((acc, r) => acc + (Number(r.quantidade)||0) * (Number(r.precoUnit)||0), 0);
      return { type: 'select', rows: [{ sub: total }] };
    }
  }

  // ── SELECT com JOIN ──
  if (/JOIN/i.test(s)) {
    // SELECT i.*, p.nome AS nomeProduto FROM tblItensPedido i JOIN tblProdutos p ON p.id = i.produtoId WHERE i.pedidoId = ?
    const mTab  = s.match(/FROM\s+(\w+)\s+\w+\s+JOIN\s+(\w+)\s+\w+\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
    const mWhere= s.match(/WHERE\s+\w+\.?(\w+)\s*=\s*\?/i);
    if (mTab) {
      const tabA     = mTab[1]; // tblItensPedido
      const tabB     = mTab[2]; // tblProdutos
      // ON p.id = i.produtoId  → colB = id, colA_fk = produtoId
      const col1name = mTab[4]; // id (do p)
      const col2name = mTab[6]; // produtoId (do i)
      const whereCol = mWhere ? mWhere[1] : null;
      const whereVal = whereCol ? params[0] : null;

      let rowsA = store[tabA] || [];
      if (whereCol && whereVal != null) {
        rowsA = rowsA.filter(r => String(r[whereCol]) === String(whereVal));
      }

      // aliases: p.nome AS nomeProduto
      const aliases = [...s.matchAll(/\w+\.(\w+)\s+AS\s+(\w+)/gi)].map(m => ({ src: m[1], as: m[2] }));

      const joined = rowsA.map(rowA => {
        // encontra o row em tabB onde tabB.col1name === rowA.col2name
        const fkVal = rowA[col2name];
        const rowB  = (store[tabB] || []).find(r => String(r[col1name]) === String(fkVal)) || {};
        const merged = { ...rowB, ...rowA };
        aliases.forEach(al => { merged[al.as] = rowB[al.src]; });
        return merged;
      });

      return { type: 'select', rows: joined };
    }
  }

  // ── SELECT simples ──
  const sel = s.match(/^SELECT .+ FROM (\w+)(.*)?$/i);
  if (sel) {
    const tabela = sel[1];
    const resto  = (sel[2] || '').trim();
    let rows = [...(store[tabela] || [])];

    // WHERE col = ? [AND col2 = ?] — suporta múltiplos AND
    const whereM = resto.match(/WHERE\s+(.+?)(?:\s+ORDER\s+|\s+LIMIT\s+|$)/i);
    if (whereM) {
      const cond = whereM[1].trim();
      const parts = cond.split(/\s+AND\s+/i);
      rows = rows.filter(row =>
        parts.every(part => {
          const m = part.trim().match(/(\w+)\s*(=|!=|LIKE)\s*(\?|'[^']*')/i);
          if (!m) return true;
          const col = m[1], op = m[2].toUpperCase();
          const val = m[3] === '?' ? params[pi++] : m[3].replace(/'/g,'');
          const rv  = String(row[col] ?? '');
          const cv  = String(val ?? '');
          if (op === '=')    return rv === cv;
          if (op === '!=')   return rv !== cv;
          if (op === 'LIKE') return new RegExp(cv.replace(/%/g,'.*'),'i').test(rv);
          return true;
        })
      );
    }

    // ORDER BY
    const ordM = resto.match(/ORDER BY\s+(\w+)(\s+DESC)?/i);
    if (ordM) {
      const campo = ordM[1], desc = !!ordM[2];
      rows = rows.slice().sort((a,b) => {
        if (a[campo] < b[campo]) return desc?1:-1;
        if (a[campo] > b[campo]) return desc?-1:1;
        return 0;
      });
    }

    // LIMIT
    const limM = resto.match(/LIMIT\s+(\d+)/i);
    if (limM) rows = rows.slice(0, Number(limM[1]));

    return { type: 'select', rows };
  }

  return { type: 'noop', rows: [] };
}

// ─── Interface pública (idêntica ao better-sqlite3) ───────────────────────────
const dbApi = {
  exec()   { return this; },  // schema criado em initSchema
  pragma() { return this; },

  prepare(sql) {
    return {
      run(...args) {
        const r = _parseSql(sql, args.flat());
        return { lastInsertRowid: r.lastInsertRowid ?? null, changes: r.changes ?? 0 };
      },
      get(...args) {
        const r = _parseSql(sql, args.flat());
        return r.rows ? r.rows[0] : undefined;
      },
      all(...args) {
        const r = _parseSql(sql, args.flat());
        return r.rows || [];
      }
    };
  },

  close() { salvar(); }
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function initSchema() {
  const tabelas = ['tblProdutos','tblClientes','tblCupons','tblPedidos',
                   'tblItensPedido','tblHistoricoStatus','tblLogs'];
  tabelas.forEach(t => { if (!store[t]) store[t] = []; });
  if (!store._seq) store._seq = {};

  CUPONS_PADRAO.forEach(c => {
    if (!store.tblCupons.find(r => r.codigo === c.codigo)) {
      store.tblCupons.push(c);
      if (!store._seq.tblCupons || store._seq.tblCupons < c.id)
        store._seq.tblCupons = c.id;
    }
  });
  salvar();
}

function getDb() {
  if (!store) {
    store = carregar() || {};
    initSchema();
  }
  return dbApi;
}

function closeDb() {
  if (store) { salvar(); store = null; }
}

module.exports = { getDb, closeDb };
