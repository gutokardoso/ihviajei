const CACHE_PREFIX='ihviajei-';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
// Intencionalmente sem interceptação de fetch: HTML, JS, CSS, vídeo e demais
// arquivos são entregues diretamente pelo servidor. Isso evita cache obsoleto
// e não interfere em requisições HTTP Range usadas pelo vídeo da home.
