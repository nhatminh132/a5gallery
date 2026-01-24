import React, { useState, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Reaction {
  emoji: string;
  count: number;
}

interface ReactionsBarProps {
  mediaId?: string;
  commentId?: string;
  className?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '😮', '👏', '💯'];

export default function ReactionsBar({ mediaId, commentId, className = '' }: ReactionsBarProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReactions();
    if (user) {
      loadUserReactions();
    }
  }, [mediaId, commentId, user]);

  const loadReactions = async () => {
    try {
      if (mediaId) {
        const { data, error } = await supabase.rpc('get_media_reactions', {
          media_uuid: mediaId
        });
        if (error) throw error;
        setReactions(data || []);
      } else if (commentId) {
        const { data, error } = await supabase.rpc('get_comment_reactions', {
          comment_uuid: commentId
        });
        if (error) throw error;
        setReactions(data || []);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const loadUserReactions = async () => {
    try {
      let query = supabase
        .from('reactions')
        .select('emoji')
        .eq('user_id', user?.id);

      if (mediaId) {
        query = query.eq('media_id', mediaId);
      } else if (commentId) {
        query = query.eq('comment_id', commentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setUserReactions(new Set((data || []).map(r => r.emoji)));
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) {
      alert('Please log in to react');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('toggle_reaction', {
        user_uuid: user.id,
        target_media_uuid: mediaId || null,
        target_comment_uuid: commentId || null,
        reaction_emoji: emoji
      });

      if (error) throw error;

      // Update local state
      if (data) {
        // Added reaction
        setUserReactions(prev => new Set([...prev, emoji]));
      } else {
        // Removed reaction
        setUserReactions(prev => {
          const next = new Set(prev);
          next.delete(emoji);
          return next;
        });
      }

      // Reload all reactions
      await loadReactions();
      setShowPicker(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Existing Reactions */}
      <div className="flex items-center gap-1 flex-wrap">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleReaction(reaction.emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
              userReactions.has(reaction.emoji)
                ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={`${reaction.emoji} ${reaction.count}`}
          >
            <span className="text-lg">{reaction.emoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {reaction.count}
            </span>
          </button>
        ))}
      </div>

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Add reaction"
        >
          <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Emoji Picker */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full mb-2 left-0 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    userReactions.has(emoji) ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
