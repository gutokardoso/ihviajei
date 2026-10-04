'use strict';
/** PublicIA Server SDK v109 — mantenha a chave somente no servidor. */
class PublicIA {
  constructor({key, endpoint='https://publicia.com.br/api/conversions/site/events', fetchImpl=globalThis.fetch}={}) {
    if(!key) throw new Error('PUBLICIA_SERVER_SIDE_KEY não configurada.');
    if(typeof fetchImpl!=='function') throw new Error('Este ambiente precisa de fetch (Node.js 18+).');
    this.key=key; this.endpoint=endpoint; this.fetch=fetchImpl;
  }
  async send(type, externalEventId, value, currency) {
    if(!['lead','sale','revenue'].includes(type)) throw new Error('Evento PublicIA inválido.');
    if(!externalEventId) throw new Error('Informe um ID único do evento.');
    const payload={type,externalEventId:String(externalEventId),occurredAt:new Date().toISOString()};
    if(value!==undefined&&value!==null) payload.value=Number(value);
    if(currency) payload.currency=String(currency).toUpperCase();
    const response=await this.fetch(this.endpoint,{method:'POST',headers:{'Authorization':`Bearer ${this.key}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let data={}; try{data=await response.json()}catch{}
    if(!response.ok) throw new Error(data.message||data.error||`PublicIA respondeu ${response.status}`);
    return data;
  }
  lead(id){return this.send('lead',id)}
  sale(id,value,currency='BRL'){return this.send('sale',id,value,currency)}
  revenue(id,value,currency='BRL'){return this.send('revenue',id,value,currency)}
}
if(typeof module!=='undefined'&&module.exports) module.exports=PublicIA;
