type Deleted = {
  authorId: string;
  avatar: string;
  content: string;
  files: string[];
  at: number;
};
type Edited = {
  authorId: string;
  avatar: string;
  before: string;
  after: string;
  at: number;
};

const deleted = new Map<string, Deleted[]>();
const edited = new Map<string, Edited[]>();

export function saveDelete(channelId: string, value: Deleted) {
  push(deleted, channelId, value);
}
export function saveEdit(channelId: string, value: Edited) {
  push(edited, channelId, value);
}
export function deletedAt(channelId: string, index: number) {
  return fresh(deleted.get(channelId))[index];
}
export function editedAt(channelId: string, index: number) {
  return fresh(edited.get(channelId))[index];
}
export function clearSnipes(channelId: string) {
  deleted.delete(channelId);
  edited.delete(channelId);
}

function push<T extends { at: number }>(
  map: Map<string, T[]>,
  key: string,
  value: T,
) {
  map.set(key, [value, ...fresh(map.get(key))].slice(0, 10));
}

function fresh<T extends { at: number }>(items: T[] = []) {
  return items.filter((item) => Date.now() - item.at < 2 * 3_600_000);
}
