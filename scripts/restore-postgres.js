'use strict';
const fs=require('node:fs');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const execFileAsync=promisify(execFile);
async function main(){
  const url=process.env.DATABASE_URL,file=process.argv[2],confirm=process.env.RESTORE_CONFIRM;
  if(!url)throw new Error('DATABASE_URL não configurada.');
  if(!file||!fs.existsSync(file))throw new Error('Informe o caminho de um arquivo .dump existente.');
  if(confirm!=='RESTORE_POSTGRES')throw new Error('Restauração bloqueada. Defina RESTORE_CONFIRM=RESTORE_POSTGRES explicitamente.');
  console.log('[restore] Validando dump...');
  await execFileAsync('pg_restore',['--list',file],{timeout:30000,maxBuffer:4*1024*1024});
  console.log('[restore] Restaurando PostgreSQL. Esta operação substitui objetos presentes no dump...');
  await execFileAsync('pg_restore',['--clean','--if-exists','--no-owner','--no-privileges','--dbname',url,file],{timeout:300000,maxBuffer:8*1024*1024});
  console.log('[restore] Restauração concluída. Execute npm run postgres:check e testes funcionais.');
}
main().catch(e=>{console.error('[restore]',e.message);process.exit(1)});
