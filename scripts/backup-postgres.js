'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const execFileAsync=promisify(execFile);
function need(name){const v=String(process.env[name]||'').trim();if(!v)throw new Error(`${name} não configurada.`);return v}
async function main(){
  const url=need('DATABASE_URL'), supabase=need('SUPABASE_URL').replace(/\/$/,''), key=String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!key)throw new Error('SUPABASE_SECRET_KEY não configurada.');
  const bucket=String(process.env.SUPABASE_BACKUP_BUCKET||'database-backups').trim();
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'), name=`ihviajei-${stamp}.dump`, file=path.join(os.tmpdir(),name);
  try{
    await execFileAsync('pg_dump',['--format=custom','--no-owner','--no-privileges','--file',file,url],{timeout:120000,maxBuffer:1024*1024});
    await execFileAsync('pg_restore',['--list',file],{timeout:30000,maxBuffer:4*1024*1024});
    const bytes=fs.readFileSync(file);
    const r=await fetch(`${supabase}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(name)}`,{method:'POST',headers:{authorization:`Bearer ${key}`,apikey:key,'content-type':'application/octet-stream','x-upsert':'false'},body:bytes});
    if(!r.ok)throw new Error(`Supabase Storage HTTP ${r.status}: ${(await r.text()).slice(0,300)}`);
    console.log(JSON.stringify({ok:true,database:'postgres',backup:name,size:bytes.length,validated:true},null,2));
  } finally { try{if(fs.existsSync(file))fs.unlinkSync(file)}catch{} }
}
main().catch(e=>{console.error('[backup:postgres]',e.message);process.exit(1)});
