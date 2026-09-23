'use strict';
// One-way, transactional SQLite -> PostgreSQL migration. It never deletes or changes the SQLite source.
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const sqlitePath = path.resolve(process.env.DB_PATH || './data/ihviajei.db');
const q = x => '"' + String(x).replaceAll('"', '""') + '"';

function pgType(t) {
  t = String(t || 'TEXT').toUpperCase();
  if (t.includes('INT')) return 'BIGINT';
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'DOUBLE PRECISION';
  if (t.includes('BLOB')) return 'BYTEA';
  return 'TEXT';
}

function tableDefinition(cols) {
  // SQLite PRAGMA table_info uses pk=1,2,... for a composite primary key.
  // PostgreSQL accepts only one PRIMARY KEY constraint, so composite keys
  // must be emitted once at table level instead of once per column.
  const primaryKey = cols.filter(c => Number(c.pk) > 0).sort((a, b) => Number(a.pk) - Number(b.pk));
  const singlePrimaryKey = primaryKey.length === 1 ? primaryKey[0].name : null;
  const defs = cols.map(c => {
    const defaultSql = c.dflt_value == null
      ? ''
      : ' DEFAULT ' + (String(c.dflt_value).toUpperCase() === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : c.dflt_value);
    return `${q(c.name)} ${pgType(c.type)}${c.name === singlePrimaryKey ? ' PRIMARY KEY' : ''}${c.notnull ? ' NOT NULL' : ''}${defaultSql}`;
  });
  if (primaryKey.length > 1) defs.push(`PRIMARY KEY (${primaryKey.map(c => q(c.name)).join(',')})`);
  return { defs, primaryKey };
}

function printHelp() {
  console.log(`Uso: npm run migrate:postgres -- [--force]

Copia dados do SQLite (DB_PATH) para PostgreSQL (DATABASE_URL).
A origem SQLite nunca é alterada. INSERTs usam ON CONFLICT DO NOTHING.

Opções:
  --help, -h   Exibe esta ajuda e NÃO executa a migração
  --force      Confirma explicitamente a execução da migração
`);
}

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) { printHelp(); process.exit(0); }
if (!args.has('--force')) {
  console.error('[migrate:postgres] Migração bloqueada por segurança. Use --force após confirmar backup e origem.');
  process.exit(2);
}

(async () => {
  const { Client } = require('pg');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  const src = new DatabaseSync(sqlitePath, { readOnly: true });
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
  });
  await pg.connect();
  const tables = src.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x => x.name);
  await pg.query('BEGIN');
  try {
    for (const table of tables) {
      const cols = src.prepare(`PRAGMA table_info(${q(table)})`).all();
      if (!cols.length) continue;
      const { defs, primaryKey } = tableDefinition(cols);
      await pg.query(`CREATE TABLE IF NOT EXISTS ${q(table)} (${defs.join(',')})`);

      const rows = src.prepare(`SELECT * FROM ${q(table)}`).all();
      if (rows.length) {
        const names = cols.map(c => c.name);
        for (const row of rows) {
          const vals = names.map(n => row[n]);
          const ps = vals.map((_, i) => `$${i + 1}`).join(',');
          await pg.query(`INSERT INTO ${q(table)} (${names.map(q).join(',')}) VALUES (${ps}) ON CONFLICT DO NOTHING`, vals);
        }
      }

      // Auto-increment emulates SQLite INTEGER PRIMARY KEY only for a single-column integer PK.
      if (primaryKey.length === 1 && pgType(primaryKey[0].type) === 'BIGINT') {
        const pk = primaryKey[0];
        const seq = `${table}_${pk.name}_seq`;
        await pg.query(`CREATE SEQUENCE IF NOT EXISTS ${q(seq)}`);
        await pg.query(`SELECT setval($1, GREATEST(COALESCE((SELECT MAX(${q(pk.name)}) FROM ${q(table)}),0),1), true)`, [seq]);
        await pg.query(`ALTER TABLE ${q(table)} ALTER COLUMN ${q(pk.name)} SET DEFAULT nextval('${seq.replaceAll("'", "''")}')`);
      }
    }
    await pg.query('COMMIT');
    console.log(JSON.stringify({ ok: true, source: sqlitePath, tables: tables.length, message: 'Migração concluída. O SQLite permaneceu inalterado.' }, null, 2));
  } catch (e) {
    await pg.query('ROLLBACK');
    throw e;
  } finally {
    src.close();
    await pg.end();
  }
})().catch(e => {
  console.error('[migrate:postgres]', e.message);
  process.exit(1);
});
