// 🔴 مهم: غير السطر ده لاسم المستودع بتاعك
const GHPATH = '/schedule-app';

// الملفات اللي التطبيق هيخزنها عشان يشتغل من غير نت
const APP_PAGES = [
  GHPATH + '/',
  GHPATH + '/index.html',
  GHPATH + '/style.css',
  GHPATH + '/script.js',
  GHPATH + '/manifest.webmanifest',
  GHPATH + '/icons/icon-192.png',
  GHPATH + '/icons/icon-512.png'
];

// تثبيت Service Worker
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('schedule-cache-v1').then(function(cache) {
      return cache.addAll(APP_PAGES).catch(function(err) {
        console.warn('خطأ في تحميل بعض الملفات:', err);
      });
    })
  );
});

// تشغيل Service Worker
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

// تحديث Service Worker
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== 'schedule-cache-v1') {
          return caches.delete(key);
        }
      }));
    })
  );
});
