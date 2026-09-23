const fs=require('fs');const app=fs.readFileSync('public/app.js','utf8'),html=fs.readFileSync('public/index.html','utf8'),server=fs.readFileSync('server.js','utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(!html.includes('<span>Viagens</span><strong id="tripCount"'),'Cards gerais da tela inicial ainda presentes');
ok(!html.includes('data-tab="central"'),'Aba Central da viagem ainda presente');
ok(app.includes('renderOverviewTravelHub(t,d)'),'Central não integrada à Visão geral');
ok(!app.slice(app.indexOf('async function renderOverviewTravelHub'),app.indexOf('async function renderPanel')).includes('Preparação ·'),'Preparação ainda presente na Central integrada');
ok(!app.slice(app.indexOf('async function renderOverviewTravelHub'),app.indexOf('async function renderPanel')).includes('<h3>Conflitos e atenção</h3>'),'Conflitos ainda aparecem como card');
ok(server.includes("type='travel_conflict'")&&server.includes("title:'Conflito e atenção'")&&server.includes("targetTab:'overview'"),'Conflitos não foram ligados às notificações');
ok(app.indexOf('<h3>Timeline</h3>')<app.indexOf('<h3>Mala inteligente</h3>'),'Timeline/Mala fora da ordem');
ok(app.includes('<h3>Central de Emergência</h3>'),'Título Central de Emergência ausente');
console.log('OK: v143 — Central integrada, conflitos no sino e painel inicial simplificado.');