import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Mention {
  id: string;
  comment_id: string;
  comment_text: string;
  mentioning_user_id: string;
  mentioning_user_name: string;
  media_id: string;
  media_title: string;
  created_at: string;
}

export default function MentionsNotifications() {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMentions();
      
      // Subscribe to new mentions
      const subscription = supabase
        .channel('mentions')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions',
          filter: `mentioned_user_id=eq.${user.id}`
        }, () => {
          loadMentions();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadMentions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_mentions', {
        user_uuid: user?.id,
        limit_count: 10
      });

      if (error) throw error;
      setMentions(data || []);
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (mentionId: string) => {
    try {
      await supabase.rpc('mark_mention_read', {
        mention_uuid: mentionId,
        user_uuid: user?.id
      });

      setMentions(prev => prev.filter(m => m.id !== mentionId));
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="Mentions"
      >
        <Bell className="w-6 h-6" />
        {mentions.length > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {mentions.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Mentions ({mentions.length})
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  Loading...
                </div>
              ) : mentions.length === 0 ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  No new mentions
                </div>
              ) : (
                mentions.map((mention) => (
                  <div
                    key={mention.id}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white mb-1">
                          <span className="font-semibold">{mention.mentioning_user_name}</span>
                          {' '}mentioned you in a comment
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                          "{mention.comment_text}"
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          on {mention.media_title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                          {new Date(mention.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(mention.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
