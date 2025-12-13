import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type StorageId = 'storage1' | 'storage2' | 'storage3' | 'storage4';

// Cache clients per storage id
const clients: Partial<Record<StorageId, SupabaseClient>> = {};

function getEnv(name: string): string | undefined {
  // Vite exposes import.meta.env in runtime; during build-time ts sees string | boolean | undefined
  // Here we use globalThis to avoid direct import.meta.env usage in this module scope.
  // But in Vite, using import.meta.env is fine inside functions. Keep simple:
  // @ts-ignore
  return import.meta.env[name];
}

export function getStorageBucket(storageId: StorageId): string {
  const key = `VITE_STORAGE_BUCKET_${storageId.slice(-1)}`; // storage1 -> ..._1
  return (getEnv(key) || 'media') as string;
}

export function getStorageUrl(storageId: StorageId): string | undefined {
  const key = `VITE_SUPABASE_URL_${storageId.slice(-1)}`;
  return getEnv(key);
}

export function getStorageAnonKey(storageId: StorageId): string | undefined {
  const key = `VITE_SUPABASE_ANON_KEY_${storageId.slice(-1)}`;
  return getEnv(key);
}

function hasStorageEnv(storageId: StorageId): boolean {
  return Boolean(getStorageUrl(storageId) && getStorageAnonKey(storageId));
}

export function getStorageClient(storageId: StorageId): SupabaseClient {
  if (clients[storageId]) return clients[storageId]!;
  const url = getStorageUrl(storageId);
  const anon = getStorageAnonKey(storageId);
  if (!url || !anon) {
    // Fallback to storage1 for local/dev when secondary envs are missing
    if (storageId !== 'storage1') {
      return getStorageClient('storage1');
    }
    throw new Error(`Missing environment for ${storageId}: ${url ? '' : 'URL'} ${anon ? '' : 'ANON_KEY'}`);
  }
  clients[storageId] = createClient(url, anon);
  return clients[storageId]!;
}

export function pickMediaStorage(): StorageId {
  // Prefer storage2-4 for media per requirement; but if not configured, use storage1
  const candidates: StorageId[] = ['storage2', 'storage3', 'storage4'].filter((id) => hasStorageEnv(id as StorageId)) as StorageId[];
  if (candidates.length === 0) return 'storage1';
  const index = Math.floor(Date.now() / 1000) % candidates.length;
  return candidates[index];
}

export function getPublicUrl(storageId: StorageId, path: string): string {
  try {
    const bucket = getStorageBucket(storageId);
    const client = getStorageClient(storageId);
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    // Fallback to storage1 if the specified storage is not configured locally
    const bucket = getStorageBucket('storage1');
    const client = getStorageClient('storage1');
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export async function upload(storageId: StorageId, path: string, file: Blob | File, options?: { contentType?: string; upsert?: boolean; }): Promise<void> {
  const bucket = getStorageBucket(storageId);
  const client = getStorageClient(storageId);
  const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, ...options });
  if (error) throw error;
}

export async function download(storageId: StorageId, path: string): Promise<Blob> {
  const bucket = getStorageBucket(storageId);
  const client = getStorageClient(storageId);
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}

export async function remove(storageId: StorageId, paths: string[]): Promise<void> {
  const bucket = getStorageBucket(storageId);
  const client = getStorageClient(storageId);
  const { error } = await client.storage.from(bucket).remove(paths);
  if (error) throw error;
}
