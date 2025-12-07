import { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useVerification } from '../hooks/useVerification';
import LoadingSpinner from './LoadingSpinner';

interface MediaItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  thumbnail_path: string | null;
  user_id: string;
  upload_date: string;
  is_verified: boolean;
  verification_notes: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function VerificationPanel() {
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const { user } = useAuth();
  const { verifyMedia, rejectMedia, loading: verificationLoading } = useVerification();

  useEffect(() => {
    if (user?.is_admin) {
      loadPendingMedia();
    }
  }, [user]);

  const loadPendingMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select(`
          id,
          title,
          file_path,
          file_type,
          thumbnail_path,
          user_id,
          upload_date,
          is_verified,
          verification_notes,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('is_verified', false)
        .order('upload_date', { ascending: true });

      if (error) throw error;

      setPendingMedia(data || []);
    } catch (error) {
      console.error('Error loading pending media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (mediaId: string) => {
    const success = await verifyMedia(mediaId, verificationNotes);
    if (success) {
      await loadPendingMedia();
      setSelectedMedia(null);
      setVerificationNotes('');
    }
  };

  const handleReject = async (mediaId: string) => {
    const notes = verificationNotes || 'Content rejected by admin';
    const success = await rejectMedia(mediaId, notes);
    if (success) {
      await loadPendingMedia();
      setSelectedMedia(null);
      setVerificationNotes('');
    }
  };

  const getMediaUrl = (media: MediaItem) => {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(media.thumbnail_path || media.file_path);
    return data.publicUrl;
  };

  if (!user?.is_admin) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (pendingMedia.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
        <p className="text-green-700 dark:text-green-300 font-medium">All caught up!</p>
        <p className="text-green-600 dark:text-green-400 text-sm">No media pending verification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Media Verification Queue ({pendingMedia.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {pendingMedia.map((media) => (
          <div
            key={media.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex gap-4">
              {/* Media Preview */}
              <div className="flex-shrink-0">
                <img
                  src={getMediaUrl(media)}
                  alt={media.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>

              {/* Media Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {media.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploaded by: {media.profiles?.full_name || media.profiles?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(media.upload_date).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    Pending Verification
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedMedia(selectedMedia === media.id ? null : media.id)}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  {selectedMedia === media.id ? 'Cancel' : 'Review'}
                </button>
              </div>
            </div>

            {/* Verification Actions */}
            {selectedMedia === media.id && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verification Notes (Optional)
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add notes about this verification..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(media.id)}
                      disabled={verificationLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(media.id)}
                      disabled={verificationLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}