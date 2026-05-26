self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Failed to parse push event data:", e);
  }

  const title = data.title || "EncuentroDeFe";
  const options = {
    body: data.body || "",
    icon: "/images/app-icon.svg",
    badge: "/images/app-icon.svg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/member/tickets",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const targetUrl = event.notification.data.url;
      
      // If a window is already open, navigate it to the target URL and focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a brand new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
