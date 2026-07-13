/* Evora service worker — Web Push */
/* eslint-disable no-undef */
self.addEventListener("push", (event) => {
  let data = { title: "", body: "", url: "/", brand: "" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // ignore malformed payloads
  }

  const title = (data.title || data.brand || "Evora").trim() || "Evora";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";
  event.waitUntil(clients.openWindow(url));
});
