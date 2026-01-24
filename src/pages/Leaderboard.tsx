import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Image, MessageCircle, TrendingUp, Crown, Medal, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AvatarSkeleton, TextSkeleton } from '../components/SkeletonLoader';

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  upload_count: number;
  comment_count: number;
  total_score: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploadLeaders, setUploadLeaders] = useState<LeaderboardUser[]>([]);
  const [commentLeaders, setCommentLeaders] = useState<LeaderboardUser[]>([]);
  const [activeTab, setActiveTab] = useState<'uploads' | 'comments'>('uploads');

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      // Get upload leaders
      const { data: uploads, error: uploadsError } = await supabase
        .rpc('get_upload_leaderboard', { limit_count: 10 });

      if (uploadsError) {
        console.error('Error loading upload leaderboard:', uploadsError);
      } else {
        setUploadLeaders(uploads || []);
      }

      // Get comment leaders
      const { data: comments, error: commentsError } = await supabase
        .rpc('get_comment_leaderboard', { limit_count: 10 });

      if (commentsError) {
        console.error('Error loading comment leaderboard:', commentsError);
      } else {
        setCommentLeaders(comments || []);
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank + 1}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 1) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white';
  };

  const currentLeaders = activeTab === 'uploads' ? uploadLeaders : commentLeaders;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top contributors</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('uploads')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'uploads'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Image className="w-5 h-5" />
              <span className="font-medium">Most Uploads</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Most Comments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                <AvatarSkeleton />
                <TextSkeleton lines={2} />
              </div>
            ))}
          </div>
        ) : currentLeaders.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentLeaders.map((user, index) => (
              <div
                key={user.id}
                onClick={() => navigate(`/user/${user.id}`)}
                className={`${getRankBadge(index)} rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg ${
                  index === 0 ? 'ring-4 ring-yellow-400/50' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {(user.full_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {user.full_name || 'Anonymous User'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {activeTab === 'uploads' 
                      ? `${user.upload_count} uploads`
                      : `${user.comment_count} comments`
                    }
                  </p>
                </div>

                {/* Score Badge */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold">
                      {activeTab === 'uploads' ? user.upload_count : user.comment_count}
                    </span>
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
