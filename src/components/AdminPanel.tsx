import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Users, Shield } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const [unverifiedMedia, setUnverifiedMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      loadUnverifiedMedia();
    }
  }, [profile?.is_admin]);

  const loadUnverifiedMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey (
            full_name,
            email
          )
        `)
        // .eq('is_verified', false) // Temporarily disabled - column doesn't exist yet
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setUnverifiedMedia(data || []);
    } catch (error) {
      console.error('Error loading unverified media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (mediaId: string, notes?: string) => {
    try {
      setProcessing(mediaId);
      const { error } = await supabase.rpc('verify_media', {
        media_id: mediaId,
        verification_notes: notes
      });

      if (error) throw error;

      // Remove from unverified list
      setUnverifiedMedia(prev => prev.filter(m => m.id !== mediaId));
      alert('Media verified successfully!');
    } catch (error) {
      console.error('Error verifying media:', error);
      alert('Failed to verify media');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (mediaId: string, reason: string) => {
    try {
      setProcessing(mediaId);
      const { error } = await supabase.rpc('reject_media', {
        media_id: mediaId,
        rejection_reason: reason
      });

      if (error) throw error;

      // Update the media in the list with rejection note
      setUnverifiedMedia(prev => prev.map(m => 
        m.id === mediaId 
          ? { ...m, verification_notes: reason }
          : m
      ));
      alert('Media rejected with note');
    } catch (error) {
      console.error('Error rejecting media:', error);
      alert('Failed to reject media');
    } finally {
      setProcessing(null);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Pending Verification
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {unverifiedMedia.length}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Loading media...</p>
          </div>
        ) : unverifiedMedia.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-600 dark:text-gray-300">No media pending verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {unverifiedMedia.map((media) => (
              <div key={media.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <img
                    src={`${supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl}`}
                    alt={media.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{media.title}</h3>
                  {media.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{media.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div>Uploaded by: {media.profiles?.full_name || media.profiles?.email}</div>
                    <div>Date: {new Date(media.upload_date).toLocaleDateString()}</div>
                    <div>Size: {formatFileSize(media.file_size)}</div>
                  </div>

                  {media.verification_notes && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Rejection reason:</strong> {media.verification_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(media.id)}
                      disabled={processing === media.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(media.id, reason);
                      }}
                      disabled={processing === media.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}