import { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Shield, Palette, HardDrive, Trash2, Download, Save, Eye, EyeOff, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import MediaStats from '../components/MediaStats';
import AdminUploadManager from '../components/AdminUploadManager';
import AdminDashboard from '../components/AdminDashboard';
import UploadLimitDisplay from '../components/UploadLimitDisplay';
import AdminDebug from '../components/AdminDebug';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  console.log('Settings: Component started mounting');
  
  try {
    const { user, profile, updateProfile, changeEmail } = useAuth();
    console.log('Settings: Auth context loaded', { user: !!user, profile: !!profile });
    
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    console.log('Settings: Theme context loaded', { theme });
    
    const [activeTab, setActiveTab] = useState('profile');
    // Check for admin privileges - includes specific email, role, or legacy is_admin flag
    const isAdmin = profile?.is_admin || 
                    profile?.role === 'ADMIN' || 
                    profile?.role === 'SUPER_ADMIN' ||
                    profile?.email === 'lpnminh472@gmail.com';
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    console.log('Settings: State initialized', { activeTab, isAdmin, loading });
  
  // Profile settings
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [uploadNotifications, setUploadNotifications] = useState(true);
  
  // Storage info
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 8589934592 }); // 8GB limit

  useEffect(() => {
    loadStorageInfo();
  }, [user]);

  const loadStorageInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('media')
        .select('file_size')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      const used = data?.reduce((sum, item) => sum + item.file_size, 0) || 0;
      setStorageInfo(prev => ({ ...prev, used }));
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) {
      setMessage({ type: 'error', text: 'Please enter a new email address' });
      return;
    }
    
    if (!newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    
    if (newEmail === user?.email) {
      setMessage({ type: 'error', text: 'New email must be different from current email' });
      return;
    }
    
    try {
      setLoading(true);
      const result = await changeEmail(newEmail);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Email change initiated!' });
        setNewEmail('');
        setShowEmailChange(false);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change email' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change email' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      const exportData = {
        profile: profile,
        media: data,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-gallery-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'account', label: t('settings.account'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'storage', label: t('settings.storage'), icon: HardDrive },
    ...(isAdmin ? [{ id: 'admin', label: t('settings.adminPanel'), icon: Users }] : []),
  ];

  const formatStorageUsed = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(0)} MB`;
    }
  };

  const formatStorageDisplay = (usedBytes: number, totalBytes: number) => {
    const usedFormatted = formatStorageUsed(usedBytes);
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(0);
    return `${usedFormatted} / ${totalGB} GB`;
  };

  const storagePercentage = (storageInfo.used / storageInfo.total) * 100;

  console.log('Settings: About to render component');
  
  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Particle Background - only in dark mode */}
      <div className="particles-bg absolute inset-0 z-0 hidden dark:block"></div>
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t('settings.backToGallery')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-500/30 rounded-lg shadow-lg dark:shadow-gray-500/20">
                <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('settings.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden dark:backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 dark:backdrop-blur-sm">
              {/* Message */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.profileInfo')}</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.emailAddress')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg"
                          />
                          <button
                            onClick={() => setShowEmailChange(!showEmailChange)}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                          >
                            {t('settings.change')}
                          </button>
                        </div>
                        
                        {showEmailChange && (
                          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.newEmailAddress')}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter new email address"
                              />
                              <button
                                onClick={handleEmailChange}
                                disabled={loading || !newEmail}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                              >
                                {t('settings.update')}
                              </button>
                              <button
                                onClick={() => {
                                  setShowEmailChange(false);
                                  setNewEmail('');
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                              >
                                {t('settings.cancel')}
                              </button>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              {t('settings.emailConfirmation')}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.fullName')}
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder={t('settings.enterFullName')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.bio')}
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                          placeholder={t('settings.tellAboutYourself')}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium disabled:opacity-50"
                      >
                        <Save className="w-5 h-5" />
                        {t('settings.saveChanges')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.securitySettings')}</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.currentPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder={t('settings.enterCurrentPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.newPassword')}
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder={t('settings.enterNewPassword')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.confirmNewPassword')}
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder={t('settings.confirmPassword')}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={handlePasswordChange}
                        disabled={loading || !newPassword || !confirmPassword}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium disabled:opacity-50"
                      >
                        <Shield className="w-5 h-5" />
                        {t('settings.updatePassword')}
                      </button>
                      
                      <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium disabled:opacity-50"
                      >
                        <Download className="w-5 h-5" />
                        {t('settings.exportData')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notificationPreferences')}</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.emailNotifications')}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            emailNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.uploadNotifications')}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.uploadNotificationsDesc')}</p>
                        </div>
                        <button
                          onClick={() => setUploadNotifications(!uploadNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            uploadNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              uploadNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.appearance')}</h2>
                    <div className="space-y-6">
                      {/* Language Selection */}
                      <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('settings.language')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setLanguage('en')}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              language === 'en'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <span className="text-2xl">🇺🇸</span>
                            <span className="text-gray-900 dark:text-white font-medium">English</span>
                          </button>
                          
                          <button
                            onClick={() => setLanguage('vi')}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              language === 'vi'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <span className="text-2xl">🇻🇳</span>
                            <span className="text-gray-900 dark:text-white font-medium">Tiếng Việt</span>
                          </button>
                        </div>
                      </div>

                      {/* Theme Selection */}
                      <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('settings.theme')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              theme === 'light'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
                            <span className="text-gray-900 dark:text-white">{t('settings.light')}</span>
                          </button>
                          
                          <button
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              theme === 'dark'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded"></div>
                            <span className="text-gray-900 dark:text-white">{t('settings.dark')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage Tab */}
              {activeTab === 'storage' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.storageUsage')}</h2>
                    
                    <UploadLimitDisplay className="mb-6" showDetails={true} />
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.storageUsed')}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatStorageDisplay(storageInfo.used, storageInfo.total)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {storagePercentage.toFixed(1)}{t('settings.storagePercentage')}
                      </p>
                    </div>
                    
                    <MediaStats />
                  </div>
                </div>
              )}

              {/* Admin Panel Tab */}
              {activeTab === 'admin' && isAdmin && (
                <div className="space-y-6">
                  <AdminDashboard />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
  
  } catch (error) {
    console.error('Settings: Component error', error);
    return (
      <div className="min-h-screen bg-white dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Settings Error</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
            <p className="text-red-700 dark:text-red-300 mb-4">
              There was an error loading the Settings page:
            </p>
            <pre className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-4 rounded overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
            <button
              onClick={() => onNavigate('home')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}