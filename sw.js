const CACHE_NAME = "camp-ops-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./task-layout.css",
  "./js/data.js",
  "./js/store.js",
  "./js/views/common.js",
  "./js/views/dashboard.js",
  "./js/views/tasks.js",
  "./js/views/requests.js",
  "./js/views/supplies.js",
  "./js/views/clock.js",
  "./js/views/schedule.js",
  "./js/views/users.js",
  "./js/app-main.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
