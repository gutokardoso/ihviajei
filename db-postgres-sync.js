'use strict';
const {Worker}=require('node:worker_threads');
const path=require('node:path');
const SIZE=32*1024*1024, sab=new SharedArrayBuffer(SIZE),ctrl=new Int32Array(sab,0,3),bytes=new Uint8Array(sab,12);
Atomics.store(ctrl,0,1);
const worker=new Worker(path.join(__dirname,'postgres-sync-worker.js'),{workerData:{sab,url:process.env.DATABASE_URL,sslDisable:process.env.PGSSL==='disable'}});
function receive(timeout=30000){const r=Atomics.wait(ctrl,0,1,timeout);if(r==='timed-out')throw new Error('Timeout ao aguardar PostgreSQL');const len=Atomics.load(ctrl,1),obj=JSON.parse(Buffer.from(bytes.slice(0,len)).toString('utf8'));Atomics.store(ctrl,0,0);if(!obj.ok){const e=new Error(obj.error?.message||'Erro PostgreSQL');e.code=obj.error?.code;throw e}return obj.result??obj;}
// Wait for the worker's initial connection result.
const ready=receive(15000);if(!ready.ready)throw new Error('PostgreSQL não inicializou');
function call(kind,sql,params=[]){if(Atomics.load(ctrl,0)!==0)throw new Error('PostgreSQL ocupado');Atomics.store(ctrl,0,1);worker.postMessage({kind,sql,params});return receive();}
module.exports={kind:'postgres',prepare(sql){return {get:(...p)=>call('get',sql,p),all:(...p)=>call('all',sql,p),run:(...p)=>call('run',sql,p)}} ,exec(sql){return call('exec',sql,[])},close(){worker.terminate()}};
