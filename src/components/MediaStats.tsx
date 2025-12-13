import { useState, useEffect } from 'react';
import { BarChart3, Image, Video, HardDrive, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatFileSize } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';

interface StatsData {
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
  totalSize: number;
  recentUploads: number;
  averageFileSize: number;
}

export default function MediaStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalMedia: 0,
    totalImages: 0,
    totalVideos: 0,
    totalSize: 0,
    recentUploads: 0,
    averageFileSize: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    } else {
      setStats({
        totalMedia: 0,
        totalImages: 0,
        totalVideos: 0,
        totalSize: 0,
        recentUploads: 0,
        averageFileSize: 0,
      });
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Loading stats for user:', user.id);

      const { data, error } = await supabase
        .from('media')
        .select('file_type, media_type, file_size, upload_date, storage_provider')
        .eq('user_id', user.id);

      if (error) {
        console.error('Stats loading error:', error);
        return;
      }

      if (data) {
        const images = data.filter(m => m.media_type ? m.media_type === 'image' : m.file_type?.startsWith('image/'));
        const videos = data.filter(m => m.media_type ? m.media_type === 'video' : m.file_type?.startsWith('video/'));
        const totalSize = data.reduce((sum, m) => sum + (m.file_size || 0), 0);

        // Per-storage usage breakdown
        const perStorage = data.reduce((acc: Record<string, number>, m: any) => {
          const key = m.storage_provider || 'storage1';
          acc[key] = (acc[key] || 0) + (m.file_size || 0);
          return acc;
        }, {} as Record<string, number>);

        const s2 = perStorage['storage2'] || 0;
        const s3 = perStorage['storage3'] || 0;
        const s4 = perStorage['storage4'] || 0;
        
        // Count uploads in the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentUploads = data.filter(m => 
          new Date(m.upload_date) > lastWeek
        ).length;

        const newStats = {
          totalMedia: data.length,
          totalImages: images.length,
          totalVideos: videos.length,
          totalSize,
          recentUploads,
          averageFileSize: data.length > 0 ? totalSize / data.length : 0,
        } as StatsData & { s2?: number; s3?: number; s4?: number };
        (newStats as any).s2 = s2;
        (newStats as any).s3 = s3;
        (newStats as any).s4 = s4;

        console.log('Stats loaded:', newStats);
        setStats(newStats);
      }
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    {
      label: 'Images',
      value: stats.totalImages.toLocaleString(),
      icon: Image,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Videos',
      value: stats.totalVideos.toLocaleString(),
      icon: Video,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Storage Used',
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      extra: (stats as any).s2 || (stats as any).s3 || (stats as any).s4 ?
        `S2: ${formatFileSize(((stats as any).s2 || 0))}  •  S3: ${formatFileSize(((stats as any).s3 || 0))}  •  S4: ${formatFileSize(((stats as any).s4 || 0))}`
        : undefined,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
            <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          {stat.extra && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.extra}</p>
          )}
        </div>
      ))}
    </div>
  );
}