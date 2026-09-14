const CACHE = "contodo-v3";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // ページ本体: ブラウザの一時保存を使わずネットから取得（更新をすぐ反映）、つながらなければ保存版
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); } return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // それ以外（フォント・アイコン）: 保存版優先、なければ取得して保存
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
