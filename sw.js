
const CACHE='pam-v11-cache-v1';
const ASSETS=['./','index.html','styles.css','app.js','data.json','manifest.webmanifest',
'assets/padel-arena-manager.jpeg','assets/eden-padel-club.jpeg','assets/happy-time.jpeg','assets/aics.jpeg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
