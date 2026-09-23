const CACHE='ihviajei-v148';
const CORE=['/','/style.css?v=148','/app.js?v=148','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(u.pathname.startsWith('/api/')){e.respondWith(fetch(e.request));return}
 const networkFirst=e.request.mode==='navigate'||u.pathname==='/'||u.pathname==='/index.html'||u.pathname==='/style.css'||u.pathname==='/app.js';
 if(networkFirst){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(x=>x||caches.match('/'))));return}
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r})));
});
self.addEventListener('push',e=>{let d={};try{d=e.data?.json()||{}}catch{d={body:e.data?.text()||''}}e.waitUntil(self.registration.showNotification(d.title||'Ih, viajei!',{body:d.body||'Há uma atualização na sua viagem.',data:d.data||{url:'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data?.url||'/'))});
