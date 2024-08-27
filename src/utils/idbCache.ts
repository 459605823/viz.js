import {delMany, get, keys, set} from 'idb-keyval';

export async function getCache(url: string, type: 'blob' | 'json' = 'blob', version?: string) {
  const cacheKey = `${url}${version ? `@${version}` : ''}`;
  const cache = await get(cacheKey);
  if (!cache) {
    const keysToDelete = (await keys()).filter(key =>
      (key as string).startsWith(url),
    );
    if (keysToDelete.length) {
      await delMany(keysToDelete);
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await (type === 'blob' ? res.blob() : res.json());
      await set(cacheKey, data);
      return URL.createObjectURL(data);
    }
  }
  return URL.createObjectURL(cache);
}
