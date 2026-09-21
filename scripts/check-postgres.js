'use strict';
const {Client}=require('pg');
(async()=>{if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL não configurada.');const c=new Client({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='disable'?false:{rejectUnauthorized:false}});await c.connect();const r=await c.query('select current_database() db, current_user usr, version() version');console.log(JSON.stringify({ok:true,database:r.rows[0].db,user:r.rows[0].usr,version:r.rows[0].version.split(' on ')[0]},null,2));await c.end()})().catch(e=>{console.error('[postgres:check]',e.message);process.exit(1)});
