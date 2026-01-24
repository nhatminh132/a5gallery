import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Users, Shield } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';
import { getMediaUrl } from '../lib/uploadService';

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
        .eq('is_verified', false)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center border border-white rounded-xl p-8 neon-white">
          <Shield className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/80">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black border border-white rounded-xl p-6 mb-6 neon-white">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white neon-white">Admin Panel</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black border border-white p-4 rounded-lg neon-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">
                  Pending Verification
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {unverifiedMedia.length}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-white/80 mt-2">Loading media...</p>
          </div>
        ) : unverifiedMedia.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">All Caught Up!</h3>
            <p className="text-white/80">No media pending verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {unverifiedMedia.map((media) => (
              <div key={media.id} className="bg-black border border-white rounded-lg overflow-hidden neon-white">
                <div className="aspect-video bg-black border-b border-white flex items-center justify-center">
                  <img
                    src={getMediaUrl(media.file_path, media.storage_provider)}
                    alt={media.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 neon-white">{media.title}</h3>
                  {media.description && (
                    <p className="text-sm text-white/80 mb-3">{media.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-white/70 mb-4">
                    <div>Uploaded by: {media.profiles?.full_name || media.profiles?.email}</div>
                    <div>Date: {new Date(media.upload_date).toLocaleDateString()}</div>
                    <div>Size: {formatFileSize(media.file_size)}</div>
                  </div>

                  {media.verification_notes && (
                    <div className="bg-black border border-white rounded p-3 mb-4">
                      <p className="text-sm text-white">
                        <strong>Rejection reason:</strong> {media.verification_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(media.id)}
                      disabled={processing === media.id}
                      className="flex-1 bg-black border border-white text-white py-2 px-3 rounded text-sm disabled:opacity-50 cyber-button"
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
                      className="flex-1 bg-black border border-white text-white py-2 px-3 rounded text-sm disabled:opacity-50 cyber-button"
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