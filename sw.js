const CACHE_NAME = "camp-ops-v3";
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
  "./js/views/employees.js",
  "./js/views/users.js",
  "./js/app-main.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
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

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { title: "Camp Ops", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Camp Ops";
  const options = {
    body: payload.body || "New Camp Ops notification",
    data: { url: payload.url || "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "./";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
