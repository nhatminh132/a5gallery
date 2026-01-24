import React, { useEffect, useMemo, useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatFileSize } from '../lib/fileUtils';

// Simple API to compute per-storage usage from media table
async function fetchPerStorageUsage() {
  const { data, error } = await supabase
    .from('media')
    .select('storage_provider, file_size');
  if (error) throw error;
  const acc: Record<string, number> = {};
  for (const m of data || []) {
    const key = (m as any).storage_provider || 'storage1';
    const size = (m as any).file_size || 0;
    acc[key] = (acc[key] || 0) + size;
  }
  return {
    storage1: acc['storage1'] || 0,
    storage2: acc['storage2'] || 0,
    storage3: acc['storage3'] || 0,
    storage4: acc['storage4'] || 0,
  };
}

export default function AdminStorageManager() {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ storage1: 0, storage2: 0, storage3: 0, storage4: 0 });

  const total = useMemo(() => usage.storage1 + usage.storage2 + usage.storage3 + usage.storage4, [usage]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchPerStorageUsage();
      setUsage(data);
    } catch (e) {
      console.error('AdminStorageManager refresh error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const items = [
    { id: 'storage1', label: 'Storage 1' },
    { id: 'storage2', label: 'Storage 2' },
    { id: 'storage3', label: 'Storage 3' },
    { id: 'storage4', label: 'Storage 4' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-black border border-white rounded-lg p-6 neon-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-white" />
            <h3 className="text-lg font-medium text-white">Storage Usage Overview</h3>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-2 bg-black border border-white text-white rounded-lg flex items-center gap-2 cyber-button disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it) => {
            const value = (usage as any)[it.id] as number;
            return (
              <div key={it.id} className="bg-black border border-white rounded-lg p-4">
                <div className="text-sm text-white/80 mb-1">{it.label}</div>
                <div className="text-2xl font-bold text-white">{formatFileSize(value)}</div>
                {total > 0 && (
                  <div className="mt-2 w-full bg-white/20 h-2 rounded-full">
                    <div
                      className="h-2 bg-white rounded-full"
                      style={{ width: `${Math.min(100, (value / total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-black border border-white rounded-lg p-6 neon-white">
        <h4 className="text-white font-semibold mb-2">Notes</h4>
        <p className="text-white/80 text-sm">
          Storage 2–4 require correct environment variables and storage policies. If uploads fail for those storages,
          the app may fall back to Storage 1 automatically.
        </p>
      </div>
    </div>
  );
}
