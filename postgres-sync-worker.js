'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const {Client,types}=require('pg');
types.setTypeParser(20,Number);
const sab=workerData.sab, ctrl=new Int32Array(sab,0,3), bytes=new Uint8Array(sab,12);
let client, idTables=new Set();
function write(obj){const b=Buffer.from(JSON.stringify(obj));if(b.length>bytes.length)throw new Error(`Resposta PostgreSQL excede buffer (${b.length})`);bytes.fill(0,0,Math.min(bytes.length,b.length+1));bytes.set(b);Atomics.store(ctrl,1,b.length);Atomics.store(ctrl,0,2);Atomics.notify(ctrl,0);}
function placeholders(sql){let n=0,out='',quote=null;for(let i=0;i<sql.length;i++){const c=sql[i];if((c==="'"||c==='"')&&sql[i-1]!=='\\'){if(!quote)quote=c;else if(quote===c){if(sql[i+1]===c){out+=c+sql[++i];continue}quote=null}}if(c==='?'&&!quote)out+=`$${++n}`;else out+=c}return out;}
function translate(sql){let s=String(sql).trim();s=s.replace(/LIMIT\s+-1\s+OFFSET/gi,'LIMIT ALL OFFSET');s=s.replace(/json_extract\(data\s*,\s*'\$\.place_id'\)/gi,"(data::jsonb->>'place_id')");s=s.replace(/datetime\('now'\s*,\s*'-11 months'\)/gi,"(CURRENT_TIMESTAMP - INTERVAL '11 months')");return placeholders(s);}
function ddl(sql){let s=String(sql);s=s.replace(/PRAGMA\s+[^;]+;?/gi,'');s=s.replace(/\bINTEGER\s+PRIMARY\s+KEY\b/gi,'BIGSERIAL PRIMARY KEY');s=s.replace(/\bINTEGER\b/gi,'BIGINT');return s.trim();}
function normErr(e){let m=e?.message||String(e);if(e?.code==='23505')m+=' UNIQUE';if(e?.code==='42701')m+=' duplicate column';return {message:m,code:e?.code||''};}
(async()=>{try{client=new Client({connectionString:workerData.url,ssl:workerData.sslDisable?false:{rejectUnauthorized:false}});await client.connect();const r=await client.query("SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='id'");idTables=new Set(r.rows.map(x=>x.table_name));write({ok:true,ready:true});}catch(e){write({ok:false,error:normErr(e)});return}
parentPort.on('message',async msg=>{try{let sql=msg.kind==='exec'?ddl(msg.sql):translate(msg.sql),params=msg.params||[];if(!sql)return write({ok:true,result:msg.kind==='all'?[]:msg.kind==='get'?null:{changes:0}});if(msg.kind==='run'&&/^\s*INSERT\s+INTO\s+/i.test(sql)&&! /\bRETURNING\b/i.test(sql)){const table=(sql.match(/^\s*INSERT\s+INTO\s+"?([a-zA-Z0-9_]+)"?/i)||[])[1];if(idTables.has(table))sql+=' RETURNING id'}const r=await client.query(sql,params);let result;if(msg.kind==='get')result=r.rows[0]||null;else if(msg.kind==='all')result=r.rows;else if(msg.kind==='run')result={changes:r.rowCount||0,lastInsertRowid:r.rows?.[0]?.id??0};else result={changes:r.rowCount||0};write({ok:true,result});}catch(e){write({ok:false,error:normErr(e)})}});
})();
