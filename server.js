'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function loadEnv(){
  const p=path.join(__dirname,'.env'); if(!fs.existsSync(p)) return;
  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
    if(!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i=line.indexOf('='); const k=line.slice(0,i).trim(); const v=line.slice(i+1).trim();
    if(!(k in process.env)) process.env[k]=v;
  }
}
loadEnv();
const PORT=Number(process.env.PORT||3000), HOST=process.env.HOST||'0.0.0.0';
const DB_PATH=path.resolve(__dirname, process.env.DB_PATH||'./data/ihviajei.db');
const SESSION_DAYS=Math.max(1, Number(process.env.SESSION_DAYS||30));
fs.mkdirSync(path.dirname(DB_PATH),{recursive:true});
const db=new DatabaseSync(DB_PATH); db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS trips(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, destinations TEXT NOT NULL DEFAULT '', start_date TEXT, end_date TEXT, travelers INTEGER NOT NULL DEFAULT 1, profile TEXT NOT NULL DEFAULT 'moderado', currency TEXT NOT NULL DEFAULT 'EUR', target_amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL, currency TEXT NOT NULL, amount REAL NOT NULL, total_brl REAL NOT NULL, vet REAL NOT NULL, provider TEXT NOT NULL DEFAULT '', purchased_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, currency TEXT NOT NULL, kind TEXT NOT NULL, threshold REAL NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id); CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id); CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
`);
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){ const h=crypto.scryptSync(password,salt,64).toString('hex'); return `scrypt$${salt}$${h}`; }
function verifyPassword(password,stored){ try{const [,salt,h]=stored.split('$'); return crypto.timingSafeEqual(Buffer.from(hashPassword(password,salt).split('$')[2],'hex'),Buffer.from(h,'hex'));}catch{return false;} }
function normalizeEmail(s){return String(s||'').trim().toLowerCase();}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function bootstrapAdmin(){const e=normalizeEmail(process.env.ADMIN_EMAIL), p=process.env.ADMIN_PASSWORD, n=process.env.ADMIN_NAME||'Administrador'; if(!e||!p)return; if(p.length<10) throw new Error('ADMIN_PASSWORD deve ter ao menos 10 caracteres'); const found=db.prepare('SELECT id FROM users WHERE email=?').get(e); if(!found) db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')").run(n,e,hashPassword(p));}
bootstrapAdmin();
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2).map(([k,v])=>[k,decodeURIComponent(v)]));}
function currentUser(req){const t=cookies(req).session; if(!t)return null; const th=crypto.createHash('sha256').update(t).digest('hex'); const row=db.prepare('SELECT u.id,u.name,u.email,u.role,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(th); if(!row)return null; if(row.expires_at<Date.now()){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(th); return null;} return row;}
function createSession(uid){const token=crypto.randomBytes(32).toString('base64url'), th=crypto.createHash('sha256').update(token).digest('hex'); db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(th,uid,Date.now()+SESSION_DAYS*86400000); return token;}
function json(res,status,data,headers={}){const body=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(body);}
function body(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e6){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>{try{resolve(d?JSON.parse(d):{});}catch{reject(new Error('invalid_json'));}});req.on('error',reject);});}
function originOK(req){if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return true; const o=req.headers.origin; const configured=process.env.APP_ORIGIN; if(!o)return true; if(configured)return o===configured; return o===`http://${req.headers.host}`||o===`https://${req.headers.host}`;}
function requireUser(req,res){const u=currentUser(req); if(!u)json(res,401,{error:'Não autenticado'}); return u;}
function num(v,min=0){const n=Number(v);return Number.isFinite(n)&&n>=min?n:null;}
function clean(s,max=200){return String(s||'').trim().slice(0,max);}
function secureCookie(req,token){const secure=(req.headers['x-forwarded-proto']==='https'); return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}${secure?'; Secure':''}`;}
async function api(req,res,url){
  if(!originOK(req)) return json(res,403,{error:'Origem não autorizada'});
  const p=url.pathname;
  try{
    if(p==='/api/health') return json(res,200,{ok:true,version:'v4'});
    if(p==='/api/auth/register'&&req.method==='POST'){const b=await body(req), name=clean(b.name,80), email=normalizeEmail(b.email), pass=String(b.password||''); if(name.length<2||!validEmail(email)||pass.length<10)return json(res,400,{error:'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'}); try{const r=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name,email,hashPassword(pass)); const t=createSession(Number(r.lastInsertRowid)); return json(res,201,{ok:true},{'set-cookie':secureCookie(req,t)});}catch(e){if(String(e).includes('UNIQUE'))return json(res,409,{error:'Este e-mail já está cadastrado.'});throw e;}}
    if(p==='/api/auth/login'&&req.method==='POST'){const b=await body(req), email=normalizeEmail(b.email), pass=String(b.password||''); const u=db.prepare('SELECT * FROM users WHERE email=?').get(email); if(!u||!verifyPassword(pass,u.password_hash))return json(res,401,{error:'E-mail ou senha inválidos.'}); const t=createSession(u.id); return json(res,200,{ok:true},{'set-cookie':secureCookie(req,t)});}
    if(p==='/api/auth/logout'&&req.method==='POST'){const t=cookies(req).session;if(t)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(crypto.createHash('sha256').update(t).digest('hex'));return json(res,200,{ok:true},{'set-cookie':'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});}
    if(p==='/api/me'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,{id:u.id,name:u.name,email:u.email,role:u.role});}
    if(p==='/api/me'&&req.method==='PATCH'){const u=requireUser(req,res);if(!u)return;const b=await body(req),name=clean(b.name,80);if(name.length<2)return json(res,400,{error:'Nome inválido.'});db.prepare('UPDATE users SET name=? WHERE id=?').run(name,u.id);return json(res,200,{ok:true});}
    if(p==='/api/trips'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT * FROM trips WHERE user_id=? ORDER BY start_date IS NULL,start_date').all(u.id));}
    if(p==='/api/trips'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),name=clean(b.name,100),dest=clean(b.destinations,300),trav=num(b.travelers,1),target=num(b.target_amount,0),currency=clean(b.currency,3).toUpperCase();if(!name||!trav||target===null||!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Dados da viagem inválidos.'});const r=db.prepare('INSERT INTO trips(user_id,name,destinations,start_date,end_date,travelers,profile,currency,target_amount) VALUES(?,?,?,?,?,?,?,?,?)').run(u.id,name,dest,clean(b.start_date,10)||null,clean(b.end_date,10)||null,trav,clean(b.profile,30)||'moderado',currency,target);return json(res,201,{id:Number(r.lastInsertRowid)});}
    let m=p.match(/^\/api\/trips\/(\d+)$/); if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;db.prepare('DELETE FROM trips WHERE id=? AND user_id=?').run(Number(m[1]),u.id);return json(res,200,{ok:true});}
    if(p==='/api/purchases'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT p.*,t.name trip_name FROM purchases p LEFT JOIN trips t ON t.id=p.trip_id WHERE p.user_id=? ORDER BY purchased_at DESC,id DESC').all(u.id));}
    if(p==='/api/purchases'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),amount=num(b.amount,0.01),total=num(b.total_brl,0.01),trip=b.trip_id?Number(b.trip_id):null,currency=clean(b.currency,3).toUpperCase(),date=clean(b.purchased_at,10);if(!amount||!total||!date||!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Compra inválida.'});if(trip&&!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id))return json(res,403,{error:'Viagem inválida.'});const vet=total/amount;const r=db.prepare('INSERT INTO purchases(user_id,trip_id,currency,amount,total_brl,vet,provider,purchased_at) VALUES(?,?,?,?,?,?,?,?)').run(u.id,trip,currency,amount,total,vet,clean(b.provider,100),date);return json(res,201,{id:Number(r.lastInsertRowid),vet});}
    if(p==='/api/alerts'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT * FROM alerts WHERE user_id=? ORDER BY id DESC').all(u.id));}
    if(p==='/api/alerts'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),currency=clean(b.currency,3).toUpperCase(),kind=clean(b.kind,20),threshold=num(b.threshold,0);if(!['EUR','USD'].includes(currency)||!['below','above'].includes(kind)||threshold===null)return json(res,400,{error:'Alerta inválido.'});const r=db.prepare('INSERT INTO alerts(user_id,currency,kind,threshold) VALUES(?,?,?,?)').run(u.id,currency,kind,threshold);return json(res,201,{id:Number(r.lastInsertRowid)});}
    m=p.match(/^\/api\/alerts\/(\d+)$/); if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;db.prepare('DELETE FROM alerts WHERE id=? AND user_id=?').run(Number(m[1]),u.id);return json(res,200,{ok:true});}
    if(p==='/api/rates'&&req.method==='GET'){const currency=(url.searchParams.get('currency')||'EUR').toUpperCase();if(!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Moeda inválida.'});try{const r=await fetch(`https://api.frankfurter.app/latest?from=${currency}&to=BRL`,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw new Error('upstream');const d=await r.json();return json(res,200,{currency,brl:d.rates.BRL,date:d.date,source:'Frankfurter / dados de referência do BCE'});}catch{return json(res,503,{error:'Cotação indisponível no momento. Nenhum valor fictício foi exibido.'});}}
    if(p==='/api/admin/stats'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;if(u.role!=='admin')return json(res,403,{error:'Acesso restrito.'});const one=q=>db.prepare(q).get().n;return json(res,200,{users:one('SELECT COUNT(*) n FROM users'),trips:one('SELECT COUNT(*) n FROM trips'),purchases:one('SELECT COUNT(*) n FROM purchases'),alerts:one('SELECT COUNT(*) n FROM alerts')});}
    return json(res,404,{error:'Rota não encontrada'});
  }catch(e){console.error(e);return json(res,500,{error:'Erro interno.'});}
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
function staticFile(req,res,url){let rel=url.pathname==='/'?'index.html':url.pathname.slice(1);rel=path.normalize(rel).replace(/^(\.\.[/\\])+/, '');const base=path.join(__dirname,'public'),f=path.join(base,rel);if(!f.startsWith(base)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.frankfurter.app; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});fs.createReadStream(f).pipe(res);}
const server=http.createServer((req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname.startsWith('/api/'))api(req,res,url);else staticFile(req,res,url);});
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`Ih, viajei! v4 em http://${HOST}:${PORT}`));
module.exports={server,db,hashPassword,verifyPassword};
