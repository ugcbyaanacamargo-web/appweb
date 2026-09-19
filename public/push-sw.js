const DB_NAME = 'oris360-sales';

function validMission(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.scopeKey === 'string' &&
    typeof value.title === 'string' &&
    typeof value.assignedAt === 'string'
  );
}

async function openExistingDatabase() {
  if (typeof indexedDB.databases !== 'function') return null;
  const databases = await indexedDB.databases();
  if (!databases.some(database => database.name === DB_NAME)) return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistMissionFromPush(mission) {
  if (!validMission(mission)) return;

  const db = await openExistingDatabase();
  if (!db || !db.objectStoreNames.contains('missions')) {
    if (db) db.close();
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = db.transaction('missions', 'readwrite');
    const store = transaction.objectStore('missions');
    const key = [mission.scopeKey, mission.id];
    const read = store.get(key);

    read.onsuccess = () => {
      const current = read.result;
      if (current?.completed || current?.pendingReturn) return;
      store.put({
        ...mission,
        completed: Boolean(mission.completed),
        pendingReturn: false
      });
    };
    read.onerror = () => reject(read.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

  db.close();
}

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Óris360°';
  const options = {
    body: payload.body || 'Você recebeu uma nova Tarefa / Missão.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag || 'oris360-mission',
    data: { url: payload.url || '/?open=missions' }
  };

  event.waitUntil(
    Promise.all([
      persistMissionFromPush(payload.mission).catch(() => undefined),
      self.registration.showNotification(title, options)
    ])
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/?open=missions', self.location.origin).toString();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(client => client.url.startsWith(self.location.origin));
      if (existing) {
        if ('navigate' in existing) existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
