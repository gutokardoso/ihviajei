const fs=require('fs'),path=require('path'),assert=require('assert');
const app=fs.readFileSync(path.join(__dirname,'public','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'public','style.css'),'utf8');
assert.ok(app.includes('function renderPackingCalendar('),'Calendário da Mala inteligente precisa existir');
assert.ok(app.includes("tripDateRange(trip.start_date,trip.end_date)"),'Calendário deve usar datas reais da viagem');
assert.ok(app.includes('<h3>Mala inteligente</h3>'),'Título deve ser Mala inteligente');
assert.ok(app.includes('Adicione ao checklist inteligente'),'CTA solicitado deve existir');
assert.ok(app.includes('packingWeatherIcon'),'Calendário deve mapear códigos meteorológicos para ícones');
assert.ok(app.includes('Previsão meteorológica ainda não disponível para esta data'),'Calendário real não deve inventar meteorologia fora do alcance da API');
assert.ok(css.includes('.packingDays{display:grid'),'Layout do calendário deve existir');
console.log('OK: v141 — Mala inteligente por datas, meses, ícones reais e CTA validados.');

assert.ok(app.includes('As recomendações de vestuário são atualizadas conforme a previsão de cada local.'),'Novo texto da Mala inteligente deve existir');
assert.ok(!app.includes('Clima dia a dia nas datas da sua viagem'),'Texto removido não pode permanecer');
assert.ok(app.includes('renderPackingCalendarDemo'),'Prévia visual temporária precisa existir');
assert.ok(app.includes('Dados meteorológicos ilustrativos apenas para visualizar os ícones.'),'Prévia deve deixar claro que os dados são ilustrativos');
