'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path'); const cleanupDb=()=>{for(const suffix of ['','-wal','-shm']){try{fs.unlinkSync(path.join(__dirname,'data/places-test.db'+suffix))}catch{}}}; cleanupDb();
process.env.PORT='32001'; process.env.DB_PATH='./data/places-test.db'; process.env.APP_ORIGIN='http://localhost:32001';
process.env.GOOGLE_PLACES_API_KEY='server-places-test-key'; delete process.env.GOOGLE_MAPS_API_KEY;
const {normalizeGooglePlaces,googleNearbyRestaurants,assistantNearbyUI}=require('./server');

const officialShape={places:[
  {id:'ChIJ-test-1',displayName:{text:'Restaurante Lisboa',languageCode:'pt'},formattedAddress:'Av. Almirante Reis, Lisboa, Portugal',location:{latitude:38.725,longitude:-9.135},rating:4.6,userRatingCount:842,googleMapsUri:'https://maps.google.com/?cid=1',priceLevel:'PRICE_LEVEL_MODERATE',primaryType:'portuguese_restaurant',primaryTypeDisplayName:{text:'Restaurante português'},photos:[{name:'places/abc/photos/photo1'}]},
  {id:'ChIJ-test-2',displayName:{text:'Casa do Bairro'},location:{latitude:38.726,longitude:-9.134}}
]};
const normalized=normalizeGooglePlaces(officialShape);
assert.equal(normalized.length,2); assert.equal(normalized[0].name,'Restaurante Lisboa'); assert.equal(normalized[0].rating,4.6); assert.equal(normalized[0].photo_name,'places/abc/photos/photo1'); assert.equal(normalized[0].reviews,842); assert.equal(normalized[0].category,'Restaurante português'); assert.deepEqual(normalized[0].location,{latitude:38.725,longitude:-9.135});
assert.equal(normalized[1].address,''); assert.equal(normalized[1].rating,0);
assert.deepEqual(normalizeGooglePlaces({}),[]); assert.deepEqual(normalizeGooglePlaces({places:null}),[]);

const realFetch=global.fetch; let captured;
global.fetch=async (url,opt)=>{captured={url,opt,body:JSON.parse(opt.body)};return {ok:true,json:async()=>officialShape};};
(async()=>{try{
  const rows=await googleNearbyRestaurants({latitude:38.725,longitude:-9.135},6);
  assert.equal(captured.url,'https://places.googleapis.com/v1/places:searchNearby');
  assert.equal(captured.opt.method,'POST'); assert.equal(captured.opt.headers['X-Goog-Api-Key'],'server-places-test-key');
  assert.deepEqual(captured.body.includedTypes,['restaurant']); assert.equal(captured.body.maxResultCount,6); assert.equal(captured.body.locationRestriction.circle.radius,1800);
  assert.deepEqual(captured.body.locationRestriction.circle.center,{latitude:38.725,longitude:-9.135});
  assert.equal(rows.length,2); assert.equal(rows[0].name,'Restaurante Lisboa');
  const ui=assistantNearbyUI({nearby_restaurants:{reference_place:{name:'Hotel',address:'Lisboa',location:{latitude:38.725,longitude:-9.135}},results:rows}});
  assert.equal(ui.type,'nearby_restaurants'); assert.equal(ui.places.length,2); assert.equal(ui.places[0].image,'/api/place-photo?name=places%2Fabc%2Fphotos%2Fphoto1'); assert.ok(Number.isFinite(ui.places[0].distance_meters));
  console.log('OK: Nearby Search e processamento da resposta Places API (New) validados.');
} finally {global.fetch=realFetch; cleanupDb()}})().catch(e=>{global.fetch=realFetch;console.error(e);process.exit(1)});

// v140 static regression guards
{
 const fs=require('node:fs'),path=require('node:path');
 const server=fs.readFileSync(path.join(__dirname,'server.js'),'utf8'),app=fs.readFileSync(path.join(__dirname,'public','app.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8');
 if(!server.includes('/travel-hub')||!server.includes('/smart-packing')||!server.includes('/calendar.ics'))throw new Error('v140: endpoints da Central PRO ausentes');
 if(!app.includes("'central'")||!html.includes('Central da viagem'))throw new Error('v140: Central PRO ausente no frontend');
 if(!fs.existsSync(path.join(__dirname,'public','sw.js'))||!fs.existsSync(path.join(__dirname,'public','manifest.webmanifest')))throw new Error('v140: PWA incompleta');
 console.log('OK: Central PRO v140, checklist inteligente, calendário e PWA validados.');
}
