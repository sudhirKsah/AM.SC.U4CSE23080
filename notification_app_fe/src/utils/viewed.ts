const VIEWED_KEY = 'viewed_notification_ids';

export function getViewedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markViewed(ids: string[]) {
  const existing = getViewedIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...existing]));
}
