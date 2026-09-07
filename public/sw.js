// Service worker minimo: solo habilita que el navegador ofrezca "Instalar
// app" / "Agregar a pantalla de inicio". NAVA es un dashboard dinamico —
// no cacheamos nada a proposito para no servir datos viejos (agenda, caja,
// clientes) por error.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sin respondWith: el navegador maneja la peticion normal.
});
