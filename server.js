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
function prepareDatabasePath(){
  const dir=path.dirname(DB_PATH);
  try{
    fs.mkdirSync(dir,{recursive:true});
    fs.accessSync(dir,fs.constants.R_OK|fs.constants.W_OK);
    const probe=path.join(dir,`.ihviajei-write-test-${process.pid}`);
    fs.writeFileSync(probe,'ok',{flag:'wx'});
    fs.unlinkSync(probe);
  }catch(err){
    console.error(`[startup] Banco inacessível. DB_PATH=${DB_PATH}; diretório=${dir}; uid=${typeof process.getuid==='function'?process.getuid():'n/a'}; erro=${err.message}`);
    throw err;
  }
}
prepareDatabasePath();
const db=new DatabaseSync(DB_PATH); db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS trips(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, destinations TEXT NOT NULL DEFAULT '', start_date TEXT, end_date TEXT, travelers INTEGER NOT NULL DEFAULT 1, profile TEXT NOT NULL DEFAULT 'moderado', currency TEXT NOT NULL DEFAULT 'EUR', target_amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL, currency TEXT NOT NULL, amount REAL NOT NULL, total_brl REAL NOT NULL, vet REAL NOT NULL, provider TEXT NOT NULL DEFAULT '', purchased_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, currency TEXT NOT NULL, kind TEXT NOT NULL, threshold REAL NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS budget_items(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,country TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',amount REAL NOT NULL DEFAULT 0,paid INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS itinerary_items(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,item_date TEXT,title TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,kind TEXT NOT NULL,provider TEXT NOT NULL DEFAULT '',confirmation TEXT NOT NULL DEFAULT '',amount_brl REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pendente',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS checklist_items(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,title TEXT NOT NULL,done INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id); CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id); CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id); CREATE INDEX IF NOT EXISTS idx_budget_trip ON budget_items(trip_id); CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON itinerary_items(trip_id); CREATE INDEX IF NOT EXISTS idx_reservations_trip ON reservations(trip_id); CREATE INDEX IF NOT EXISTS idx_checklist_trip ON checklist_items(trip_id);
`);
try{db.exec("ALTER TABLE budget_items ADD COLUMN country TEXT NOT NULL DEFAULT ''")}catch(e){if(!String(e.message).includes('duplicate column'))throw e}
try{db.exec("ALTER TABLE budget_items ADD COLUMN city TEXT NOT NULL DEFAULT ''")}catch(e){if(!String(e.message).includes('duplicate column'))throw e}
try{db.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'gratuito'")}catch(e){if(!String(e.message).includes('duplicate column'))throw e}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){ const h=crypto.scryptSync(password,salt,64).toString('hex'); return `scrypt$${salt}$${h}`; }
function verifyPassword(password,stored){ try{const [,salt,h]=stored.split('$'); return crypto.timingSafeEqual(Buffer.from(hashPassword(password,salt).split('$')[2],'hex'),Buffer.from(h,'hex'));}catch{return false;} }
function normalizeEmail(s){return String(s||'').trim().toLowerCase();}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function bootstrapAdmin(){const e=normalizeEmail(process.env.ADMIN_EMAIL), p=process.env.ADMIN_PASSWORD, n=process.env.ADMIN_NAME||'Administrador'; if(!e||!p)return; if(p.length<10) throw new Error('ADMIN_PASSWORD deve ter ao menos 10 caracteres'); const found=db.prepare('SELECT id FROM users WHERE email=?').get(e); if(!found) db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')").run(n,e,hashPassword(p));}
bootstrapAdmin();
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2).map(([k,v])=>[k,decodeURIComponent(v)]));}
function currentUser(req){const t=cookies(req).session; if(!t)return null; const th=crypto.createHash('sha256').update(t).digest('hex'); const row=db.prepare('SELECT u.id,u.name,u.email,u.role,u.plan,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(th); if(!row)return null; if(row.expires_at<Date.now()){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(th); return null;} return row;}
function createSession(uid){const token=crypto.randomBytes(32).toString('base64url'), th=crypto.createHash('sha256').update(token).digest('hex'); db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(th,uid,Date.now()+SESSION_DAYS*86400000); return token;}
function json(res,status,data,headers={}){const body=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(body);}
function body(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e6){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>{try{resolve(d?JSON.parse(d):{});}catch{reject(new Error('invalid_json'));}});req.on('error',reject);});}
function originOK(req){if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return true; const o=req.headers.origin; const configured=process.env.APP_ORIGIN; if(!o)return true; if(configured)return o===configured; return o===`http://${req.headers.host}`||o===`https://${req.headers.host}`;}
function requireUser(req,res){const u=currentUser(req); if(!u)json(res,401,{error:'Não autenticado'}); return u;}
function num(v,min=0){const n=Number(v);return Number.isFinite(n)&&n>=min?n:null;}
function clean(s,max=200){return String(s||'').trim().slice(0,max);}
function secureCookie(req,token){const secure=(req.headers['x-forwarded-proto']==='https'); return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}${secure?'; Secure':''}`;}
function institutionAction(name){
  const n=String(name||'').toUpperCase();
  const links=[
    [/SADOC/, 'https://www.sadoc.com.br/'],
    [/BRADESCO/, 'https://banco.bradesco/html/classic/produtos-servicos/cambio/index.shtm'],
    [/ITA[ÚU]/, 'https://www.itau.com.br/cambio'],
    [/BRB|BCO DE BRASILIA/, 'https://novo.brb.com.br/para-voce/contas/servicos/cambio/cambio-em-especie/'],
    [/BCO DO BRASIL|BANCO DO BRASIL/, 'https://www.bb.com.br/'],
    [/FOURTRADE/, 'https://loja.fourtrade.com.br/'],
    [/LUMINA/, 'https://www.luminacorretora.com.br/'],
    [/SINGRATUR/, 'https://cambio.singratur.com.br/']
  ];
  const found=links.find(([re])=>re.test(n));
  return found?found[1]:null;
}
async function api(req,res,url){
  if(!originOK(req)) return json(res,403,{error:'Origem não autorizada'});
  const p=url.pathname;
  try{
    if(p==='/api/health') return json(res,200,{ok:true,version:'v13'});
    if(p==='/api/auth/register'&&req.method==='POST'){const b=await body(req), name=clean(b.name,80), email=normalizeEmail(b.email), pass=String(b.password||''); if(name.length<2||!validEmail(email)||pass.length<10)return json(res,400,{error:'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'}); try{const r=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name,email,hashPassword(pass)); const t=createSession(Number(r.lastInsertRowid)); return json(res,201,{ok:true},{'set-cookie':secureCookie(req,t)});}catch(e){if(String(e).includes('UNIQUE'))return json(res,409,{error:'Este e-mail já está cadastrado.'});throw e;}}
    if(p==='/api/auth/login'&&req.method==='POST'){const b=await body(req), email=normalizeEmail(b.email), pass=String(b.password||''); const u=db.prepare('SELECT * FROM users WHERE email=?').get(email); if(!u||!verifyPassword(pass,u.password_hash))return json(res,401,{error:'E-mail ou senha inválidos.'}); const t=createSession(u.id); return json(res,200,{ok:true},{'set-cookie':secureCookie(req,t)});}
    if(p==='/api/auth/logout'&&req.method==='POST'){const t=cookies(req).session;if(t)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(crypto.createHash('sha256').update(t).digest('hex'));return json(res,200,{ok:true},{'set-cookie':'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});}
    if(p==='/api/me'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,{id:u.id,name:u.name,email:u.email,role:u.role,plan:u.plan});}
    if(p==='/api/me'&&req.method==='PATCH'){const u=requireUser(req,res);if(!u)return;const b=await body(req),name=clean(b.name,80);if(name.length<2)return json(res,400,{error:'Nome inválido.'});db.prepare('UPDATE users SET name=? WHERE id=?').run(name,u.id);return json(res,200,{ok:true});}
    if(p==='/api/trips'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT * FROM trips WHERE user_id=? ORDER BY start_date IS NULL,start_date').all(u.id));}
    if(p==='/api/trips'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;if(u.role==='admin')return json(res,403,{error:'A conta de administração geral não cria viagens.'});const b=await body(req),name=clean(b.name,100),dest=clean(b.destinations,300),trav=num(b.travelers,1),target=num(b.target_amount,0),currency=clean(b.currency,3).toUpperCase();if(!name||!trav||target===null||!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Dados da viagem inválidos.'});const r=db.prepare('INSERT INTO trips(user_id,name,destinations,start_date,end_date,travelers,profile,currency,target_amount) VALUES(?,?,?,?,?,?,?,?,?)').run(u.id,name,dest,clean(b.start_date,10)||null,clean(b.end_date,10)||null,trav,clean(b.profile,30)||'moderado',currency,target);return json(res,201,{id:Number(r.lastInsertRowid)});}
    let m=p.match(/^\/api\/trips\/(\d+)$/); if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;db.prepare('DELETE FROM trips WHERE id=? AND user_id=?').run(Number(m[1]),u.id);return json(res,200,{ok:true});}
    m=p.match(/^\/api\/trips\/(\d+)$/); if(m&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;const id=Number(m[1]),t=db.prepare('SELECT * FROM trips WHERE id=? AND user_id=?').get(id,u.id);if(!t)return json(res,404,{error:'Viagem não encontrada.'});return json(res,200,{trip:t,purchases:db.prepare('SELECT * FROM purchases WHERE trip_id=? AND user_id=? ORDER BY purchased_at DESC').all(id,u.id),budget:db.prepare('SELECT * FROM budget_items WHERE trip_id=? AND user_id=? ORDER BY id DESC').all(id,u.id),itinerary:db.prepare('SELECT * FROM itinerary_items WHERE trip_id=? AND user_id=? ORDER BY item_date,id').all(id,u.id),reservations:db.prepare('SELECT * FROM reservations WHERE trip_id=? AND user_id=? ORDER BY id DESC').all(id,u.id),checklist:db.prepare('SELECT * FROM checklist_items WHERE trip_id=? AND user_id=? ORDER BY done,id DESC').all(id,u.id)});}
    if(p==='/api/budget'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),trip=Number(b.trip_id),amount=num(b.amount,0);if(!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id)||amount===null)return json(res,400,{error:'Item inválido.'});const r=db.prepare('INSERT INTO budget_items(user_id,trip_id,country,city,category,description,amount,paid) VALUES(?,?,?,?,?,?,?,?)').run(u.id,trip,clean(b.country,80),clean(b.city,80),clean(b.category,40)||'Outros',clean(b.description,120),amount,b.paid?1:0);return json(res,201,{id:Number(r.lastInsertRowid)});}
    if(p==='/api/itinerary'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),trip=Number(b.trip_id),title=clean(b.title,120);if(!title||!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id))return json(res,400,{error:'Item inválido.'});const r=db.prepare('INSERT INTO itinerary_items(user_id,trip_id,item_date,title,location,notes) VALUES(?,?,?,?,?,?)').run(u.id,trip,clean(b.item_date,10)||null,title,clean(b.location,120),clean(b.notes,500));return json(res,201,{id:Number(r.lastInsertRowid)});}
    if(p==='/api/reservations'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),trip=Number(b.trip_id),amount=num(b.amount_brl,0);if(!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id)||amount===null)return json(res,400,{error:'Reserva inválida.'});const r=db.prepare('INSERT INTO reservations(user_id,trip_id,kind,provider,confirmation,amount_brl,status) VALUES(?,?,?,?,?,?,?)').run(u.id,trip,clean(b.kind,40)||'Outro',clean(b.provider,120),clean(b.confirmation,100),amount,clean(b.status,20)||'pendente');return json(res,201,{id:Number(r.lastInsertRowid)});}
    if(p==='/api/checklist'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),trip=Number(b.trip_id),title=clean(b.title,160);if(!title||!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id))return json(res,400,{error:'Item inválido.'});const r=db.prepare('INSERT INTO checklist_items(user_id,trip_id,title) VALUES(?,?,?)').run(u.id,trip,title);return json(res,201,{id:Number(r.lastInsertRowid)});}
    m=p.match(/^\/api\/(budget|itinerary|reservations|checklist)\/(\d+)$/); if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;const tables={budget:'budget_items',itinerary:'itinerary_items',reservations:'reservations',checklist:'checklist_items'};db.prepare(`DELETE FROM ${tables[m[1]]} WHERE id=? AND user_id=?`).run(Number(m[2]),u.id);return json(res,200,{ok:true});}
    m=p.match(/^\/api\/checklist\/(\d+)$/); if(m&&req.method==='PATCH'){const u=requireUser(req,res);if(!u)return;const b=await body(req);db.prepare('UPDATE checklist_items SET done=? WHERE id=? AND user_id=?').run(b.done?1:0,Number(m[1]),u.id);return json(res,200,{ok:true});}
    if(p==='/api/vet/reference'&&req.method==='GET'){
      const currency=(url.searchParams.get('currency')||'EUR').toUpperCase();
      if(!['EUR','USD'].includes(currency))return json(res,400,{error:'Moeda inválida.'});
      const now=new Date(); let ranking=null, reference='';
      for(let back=1;back<=8&&!ranking;back++){
        const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-back,1));
        reference=String(d.getUTCMonth()+1).padStart(2,'0')+d.getUTCFullYear();
        const vetUrl=`https://www3.bcb.gov.br/vet/rest/v2/ranking?finalidade=1&formaDeEntrega=1&mesAno=${reference}&moeda=${currency}&tipoOperacao=C&valor=100`;
        try{const r=await fetch(vetUrl,{signal:AbortSignal.timeout(8000)});if(r.ok){const x=await r.json();if(Array.isArray(x.rankingVet)&&x.rankingVet.length)ranking=x.rankingVet;}}catch{}
      }
      if(!ranking)return json(res,503,{error:'Ranking do VET indisponível no Banco Central neste momento.'});
      const rows=ranking.slice(0,10).map(x=>({institution:x.nomeIf,operations:Number(x.numOperacoes||0),vet:Number(x.vet||0)/10000,simulated:Number(x.valorSimulado||0)/10000,action_url:institutionAction(x.nomeIf),bcb_url:'https://www.bcb.gov.br/rex/IAMC/Port/Instituicoes/inst_autorizadas.asp?frame=1'}));
      return json(res,200,{source:'Banco Central do Brasil',currency,reference,rows,notice:'Ranking histórico do VET médio praticado. Os valores são de mês anterior e não constituem oferta atual. Consulte a instituição antes da compra.',url:'https://dadosabertos.bcb.gov.br/dataset/ranking-do-vet'});
    }
    if(p==='/api/rates/history'&&req.method==='GET'){
      const currency=(url.searchParams.get('currency')||'EUR').toUpperCase(),days=Math.min(180,Math.max(7,Number(url.searchParams.get('days')||30)));
      if(!['EUR','USD'].includes(currency))return json(res,400,{error:'Moeda inválida.'});
      const end=new Date(),start=new Date(Date.now()-days*86400000); let points=[],source='';
      const iso=d=>d.toISOString().slice(0,10), us=d=>String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')+'-'+d.getUTCFullYear();
      try{
        const bcb=`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?%40moeda='${currency}'&%40dataInicial='${us(start)}'&%40dataFinalCotacao='${us(end)}'&%24format=json`;
        const r=await fetch(bcb,{signal:AbortSignal.timeout(8000)}); if(!r.ok)throw new Error('bcb'); const d=await r.json();
        const byDate=new Map(); for(const x of d.value||[]){const date=String(x.dataHoraCotacao||'').slice(0,10);const brl=Number(x.cotacaoVenda);if(date&&Number.isFinite(brl))byDate.set(date,brl)}
        points=[...byDate].map(([date,brl])=>({date,brl})).sort((a,b)=>a.date.localeCompare(b.date)); source='Banco Central do Brasil (PTAX)';
      }catch{}
      if(!points.length){try{const r=await fetch(`https://api.frankfurter.app/${iso(start)}..${iso(end)}?from=${currency}&to=BRL`,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('fallback');const d=await r.json();points=Object.entries(d.rates||{}).map(([date,x])=>({date,brl:Number(x.BRL)})).filter(x=>Number.isFinite(x.brl));source='Frankfurter / referência do BCE';}catch{}}
      if(!points.length)return json(res,503,{error:'Não foi possível obter cotações reais neste momento.'});
      const vals=points.map(x=>x.brl),cur=vals.at(-1),avg=vals.reduce((a,b)=>a+b,0)/vals.length,min=Math.min(...vals),max=Math.max(...vals),position=max===min?50:100*(max-cur)/(max-min),trend=cur-vals[Math.max(0,vals.length-6)],score=Math.max(5,Math.min(95,Math.round(position*.7+(trend<0?20:trend>0?5:12))));
      return json(res,200,{currency,points,summary:{current:cur,average:avg,min,max,score,label:score>=75?'Boa oportunidade':score>=55?'Interessante':score>=40?'Neutro':'Preço elevado no histórico recente'},source});
    }
    if(p==='/api/purchases'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT p.*,t.name trip_name FROM purchases p LEFT JOIN trips t ON t.id=p.trip_id WHERE p.user_id=? ORDER BY purchased_at DESC,id DESC').all(u.id));}
    if(p==='/api/purchases'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),amount=num(b.amount,0.01),total=num(b.total_brl,0.01),trip=b.trip_id?Number(b.trip_id):null,currency=clean(b.currency,3).toUpperCase(),date=clean(b.purchased_at,10);if(!amount||!total||!date||!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Compra inválida.'});if(trip&&!db.prepare('SELECT id FROM trips WHERE id=? AND user_id=?').get(trip,u.id))return json(res,403,{error:'Viagem inválida.'});const vet=total/amount;const r=db.prepare('INSERT INTO purchases(user_id,trip_id,currency,amount,total_brl,vet,provider,purchased_at) VALUES(?,?,?,?,?,?,?,?)').run(u.id,trip,currency,amount,total,vet,clean(b.provider,100),date);return json(res,201,{id:Number(r.lastInsertRowid),vet});}
    if(p==='/api/alerts'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;return json(res,200,db.prepare('SELECT * FROM alerts WHERE user_id=? ORDER BY id DESC').all(u.id));}
    if(p==='/api/alerts'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;const b=await body(req),currency=clean(b.currency,3).toUpperCase(),kind=clean(b.kind,20),threshold=num(b.threshold,0);if(!['EUR','USD'].includes(currency)||!['below','above'].includes(kind)||threshold===null)return json(res,400,{error:'Alerta inválido.'});const r=db.prepare('INSERT INTO alerts(user_id,currency,kind,threshold) VALUES(?,?,?,?)').run(u.id,currency,kind,threshold);return json(res,201,{id:Number(r.lastInsertRowid)});}
    m=p.match(/^\/api\/alerts\/(\d+)$/); if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;db.prepare('DELETE FROM alerts WHERE id=? AND user_id=?').run(Number(m[1]),u.id);return json(res,200,{ok:true});}
    if(p==='/api/rates'&&req.method==='GET'){const currency=(url.searchParams.get('currency')||'EUR').toUpperCase();if(!['EUR','USD','GBP','CHF'].includes(currency))return json(res,400,{error:'Moeda inválida.'});try{const r=await fetch(`https://api.frankfurter.app/latest?from=${currency}&to=BRL`,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw new Error('upstream');const d=await r.json();return json(res,200,{currency,brl:d.rates.BRL,date:d.date,source:'Frankfurter / dados de referência do BCE'});}catch{return json(res,503,{error:'Cotação indisponível no momento. Nenhum valor fictício foi exibido.'});}}
    if(p==='/api/admin/stats'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;if(u.role!=='admin')return json(res,403,{error:'Acesso restrito.'});const one=q=>db.prepare(q).get().n;const totals={users:one("SELECT COUNT(*) n FROM users WHERE role='user'"),trips:one('SELECT COUNT(*) n FROM trips'),purchases:one('SELECT COUNT(*) n FROM purchases'),alerts:one('SELECT COUNT(*) n FROM alerts')};const invested=db.prepare('SELECT COALESCE(SUM(total_brl),0) n FROM purchases').get().n;const plans=db.prepare("SELECT plan,COUNT(*) n FROM users WHERE role='user' GROUP BY plan").all();const months=db.prepare("SELECT substr(created_at,1,7) month,COUNT(*) users FROM users WHERE role='user' AND created_at>=datetime('now','-11 months') GROUP BY substr(created_at,1,7) ORDER BY month").all();const tripMonths=db.prepare("SELECT substr(created_at,1,7) month,COUNT(*) trips FROM trips WHERE created_at>=datetime('now','-11 months') GROUP BY substr(created_at,1,7) ORDER BY month").all();return json(res,200,{...totals,invested,plans,months,tripMonths});}
    if(p==='/api/admin/users'&&req.method==='GET'){const u=requireUser(req,res);if(!u)return;if(u.role!=='admin')return json(res,403,{error:'Acesso restrito.'});return json(res,200,db.prepare("SELECT u.id,u.name,u.email,u.plan,u.created_at,COUNT(DISTINCT t.id) trips,COUNT(DISTINCT p.id) purchases FROM users u LEFT JOIN trips t ON t.user_id=u.id LEFT JOIN purchases p ON p.user_id=u.id WHERE u.role='user' GROUP BY u.id ORDER BY u.created_at DESC").all());}
    m=p.match(/^\/api\/admin\/users\/(\d+)$/);if(m&&req.method==='PATCH'){const u=requireUser(req,res);if(!u)return;if(u.role!=='admin')return json(res,403,{error:'Acesso restrito.'});const b=await body(req),plan=clean(b.plan,20);if(!['gratuito','intermediario','pro'].includes(plan))return json(res,400,{error:'Plano inválido.'});const r=db.prepare("UPDATE users SET plan=? WHERE id=? AND role='user'").run(plan,Number(m[1]));if(!r.changes)return json(res,404,{error:'Usuário não encontrado.'});return json(res,200,{ok:true});}
    m=p.match(/^\/api\/admin\/users\/(\d+)$/);if(m&&req.method==='DELETE'){const u=requireUser(req,res);if(!u)return;if(u.role!=='admin')return json(res,403,{error:'Acesso restrito.'});const r=db.prepare("DELETE FROM users WHERE id=? AND role='user'").run(Number(m[1]));if(!r.changes)return json(res,404,{error:'Usuário não encontrado.'});return json(res,200,{ok:true});}
    if(p==='/api/plans'&&req.method==='GET')return json(res,200,{plans:[{id:'gratuito',name:'Gratuito',price:0},{id:'intermediario',name:'Intermediário',price:29.90},{id:'pro',name:'PRO',price:59.90}],checkoutConfigured:{intermediario:!!process.env.PLAN_INTERMEDIARIO_URL,pro:!!process.env.PLAN_PRO_URL}});
    if(p==='/api/plans/select'&&req.method==='POST'){const u=requireUser(req,res);if(!u)return;if(u.role==='admin')return json(res,403,{error:'Plano não se aplica à administração geral.'});const b=await body(req),plan=clean(b.plan,20);if(plan==='gratuito'){db.prepare("UPDATE users SET plan='gratuito' WHERE id=?").run(u.id);return json(res,200,{ok:true,plan});}if(!['intermediario','pro'].includes(plan))return json(res,400,{error:'Plano inválido.'});const env=plan==='intermediario'?process.env.PLAN_INTERMEDIARIO_URL:process.env.PLAN_PRO_URL;if(!env)return json(res,503,{error:'Checkout deste plano ainda não foi configurado pelo administrador.'});return json(res,200,{checkout_url:env});}
    return json(res,404,{error:'Rota não encontrada'});
  }catch(e){console.error(e);return json(res,500,{error:'Erro interno.'});}
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
function staticFile(req,res,url){let rel=url.pathname==='/'?'index.html':url.pathname.slice(1);rel=path.normalize(rel).replace(/^(\.\.[/\\])+/, '');const base=path.join(__dirname,'public'),f=path.join(base,rel);if(!f.startsWith(base)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.frankfurter.app; img-src 'self' data: https://commons.wikimedia.org https://upload.wikimedia.org https://images.unsplash.com; base-uri 'none'; frame-ancestors 'none'"});fs.createReadStream(f).pipe(res);}
const server=http.createServer((req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname.startsWith('/api/'))api(req,res,url);else staticFile(req,res,url);});
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`Ih, viajei! v13 em http://${HOST}:${PORT}`));
module.exports={server,db,hashPassword,verifyPassword};
