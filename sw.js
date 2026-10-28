/* 오프라인에서도 앱 화면이 열리도록 기본 파일을 저장합니다. 파일을 고치면 VERSION 숫자를 올려 주세요. */
const VERSION = 'nm-v1.2.0';
const FILES = ['./', './index.html', './css/app.css', './js/config.js', './js/data-sdbpck.js', './js/store.js', './js/app.js',
  './manifest.json', './privacy.html', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Firebase·홈페이지 요청은 그대로
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
