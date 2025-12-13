import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Trash2, MoreVertical } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import UserAvatar from './UserAvatar';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_id: string;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface Like {
  id: string;
  user_id: string;
  media_id: string;
  created_at: string;
}

interface CommentsLikesProps {
  media: Media;
  className?: string;
}

export default function CommentsLikes({ media, className = '' }: CommentsLikesProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCommentsAndLikes();
  }, [media.id]);

  const loadCommentsAndLikes = async () => {
    try {
      setLoading(true);

      // Load comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          media_id,
          profiles!comments_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('media_id', media.id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
      } else {
        setComments(commentsData || []);
      }

      // Load likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('media_id', media.id);

      if (likesError) {
        console.error('Error loading likes:', likesError);
      } else {
        setLikes(likesData || []);
        setIsLiked(user ? likesData?.some(like => like.user_id === user.id) || false : false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', media.id);

        if (!error) {
          setLikes(prev => prev.filter(like => like.user_id !== user.id));
          setIsLiked(false);
        }
      } else {
        // Add like
        const { data, error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            media_id: media.id
          })
          .select()
          .single();

        if (!error && data) {
          setLikes(prev => [...prev, data]);
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          user_id: user.id,
          media_id: media.id
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          media_id,
          profiles!comments_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (!error) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return user && (
      comment.user_id === user.id || 
      profile?.is_admin || 
      profile?.role === 'ADMIN' || 
      profile?.role === 'SUPER_ADMIN' ||
      profile?.email === 'lpnminh472@gmail.com'
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Like Button and Count */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)] ${
            isLiked
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} 
          />
          <span className="text-sm font-medium">
            {likes.length} {t('modal.likes')}
          </span>
        </button>

        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">
            {comments.length} {t('modal.comments')}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        {/* Comments List */}
        {comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                {/* Avatar */}
                <UserAvatar
                  profile={comment.profiles}
                  size="sm"
                />

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="flex items-start gap-3">
            {/* User Avatar */}
            <UserAvatar
              profile={profile}
              size="sm"
            />

            {/* Input */}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('modal.addComment')}
                rows={1}
                className="w-full px-3 py-2 bg-black text-white border border-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.8)] focus:ring-0 focus:border-white resize-none text-sm"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {newComment.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting || newComment.length > 500}
                  className="flex items-center gap-1 px-3 py-1 bg-black border border-white text-white rounded-lg text-sm transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)] disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {submitting ? 'Posting...' : t('modal.post')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t('auth.signInToUpload')}</p>
          </div>
        )}
      </div>
    </div>
  );
}