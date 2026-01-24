import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Link as LinkIcon, Twitter, Github, Edit, Save, X, Calendar, Image as ImageIcon, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MediaGridSkeleton } from '../components/SkeletonLoader';
import MediaGrid from '../components/MediaGrid';
import type { Media } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  twitter: string | null;
  github: string | null;
  created_at: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    website: '',
    location: '',
    twitter: '',
    github: ''
  });
  const [mediaCount, setMediaCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUserMedia();
      loadStats();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditForm({
        bio: data.bio || '',
        website: data.website || '',
        location: data.location || '',
        twitter: data.twitter || '',
        github: data.github || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Count total media
      const { count: mediaCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setMediaCount(mediaCount || 0);

      // Count total likes received
      const { data: mediaIds } = await supabase
        .from('media')
        .select('id')
        .eq('user_id', userId);

      if (mediaIds && mediaIds.length > 0) {
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('media_id', mediaIds.map(m => m.id));

        setLikesCount(likesCount || 0);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', userId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <MediaGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {(profile.full_name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile.full_name || 'Anonymous User'}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {mediaCount} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {likesCount} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isOwnProfile && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Bio and Details */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={editForm.twitter}
                        onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GitHub
                      </label>
                      <input
                        type="text"
                        value={editForm.github}
                        onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {profile.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        {profile.twitter}
                      </a>
                    )}
                    {profile.github && (
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        {profile.github}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User's Media Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isOwnProfile ? 'Your Posts' : `${profile.full_name || 'User'}'s Posts`}
        </h2>
        {media.length > 0 ? (
          <MediaGrid media={media} />
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
