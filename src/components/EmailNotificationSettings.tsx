import React, { useState, useEffect } from 'react';
import { Mail, Bell, Save, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSettings {
  email_on_comment: boolean;
  email_on_like: boolean;
  email_on_mention: boolean;
  email_on_follow: boolean;
  email_on_album_invite: boolean;
  email_digest_frequency: 'none' | 'daily' | 'weekly';
}

export default function EmailNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    email_on_comment: true,
    email_on_like: true,
    email_on_mention: true,
    email_on_follow: false,
    email_on_album_invite: true,
    email_digest_frequency: 'daily'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_notification_settings', {
        user_uuid: user?.id
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSettings(data[0]);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase.rpc('update_notification_settings', {
        user_uuid: user?.id,
        new_email_on_comment: settings.email_on_comment,
        new_email_on_like: settings.email_on_like,
        new_email_on_mention: settings.email_on_mention,
        new_email_on_follow: settings.email_on_follow,
        new_email_on_album_invite: settings.email_on_album_invite,
        new_email_digest_frequency: settings.email_digest_frequency
      });

      if (error) throw error;

      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Email Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose when to receive email notifications
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Individual Notification Toggles */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Activity Notifications
          </h3>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Comments</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone comments on your media
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_on_comment}
              onChange={(e) => setSettings({ ...settings, email_on_comment: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Likes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone likes your media
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_on_like}
              onChange={(e) => setSettings({ ...settings, email_on_like: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Mentions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone mentions you with @username
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_on_mention}
              onChange={(e) => setSettings({ ...settings, email_on_mention: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Follows</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone follows you
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_on_follow}
              onChange={(e) => setSettings({ ...settings, email_on_follow: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Album Invites</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone invites you to collaborate on an album
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_on_album_invite}
              onChange={(e) => setSettings({ ...settings, email_on_album_invite: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        {/* Digest Frequency */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Email Digest
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="digest"
                checked={settings.email_digest_frequency === 'none'}
                onChange={() => setSettings({ ...settings, email_digest_frequency: 'none' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Never</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't send digest emails
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="digest"
                checked={settings.email_digest_frequency === 'daily'}
                onChange={() => setSettings({ ...settings, email_digest_frequency: 'daily' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Daily</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Daily summary of activity
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="digest"
                checked={settings.email_digest_frequency === 'weekly'}
                onChange={() => setSettings({ ...settings, email_digest_frequency: 'weekly' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Weekly</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly summary of activity
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Email notifications require email service configuration (SendGrid, Resend, etc.). 
            Contact the administrator if emails are not being sent.
          </p>
        </div>
      </div>
    </div>
  );
}
