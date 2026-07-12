/* Evora service worker — Web Push */
/* eslint-disable no-undef */
self.addEventListener("push", (event) => {
  let data = { title: "Evora", body: "", url: "/" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Evora", {
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
