const CACHE="champion-plus-v38";
const ASSETS=["./","index.html","styles.css","app.js","vendor/zxing-browser.min.js","catalog.json","manifest.webmanifest","icon.svg","images/apple-champion-plus.jpg","images/champion-app-icon-180.png","images/champion-app-icon-192.png","images/champion-app-icon-512.png","images/iphone-16-real.jpg","images/iphone-17-real.png","images/iphone-17e-real.png","images/iphone-17-pro-real.jpg","images/iphone-air-real.png","images/iphone-duo-real.png","images/iphone-18-pro-real.png","images/ipad-a16-real.png","images/ipad-air-real.png","images/ipad-mini-real.png","images/ipad-pro-real.png","images/watch-real.jpg","images/macbook-neo-real.jpg","images/macbook-air-real.jpg","images/macbook-pro-real.jpg","images/mac-mini-real.jpg","images/mac-studio-real.jpg","images/imac-real.jpg","images/display-real.jpg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./"))));
});
