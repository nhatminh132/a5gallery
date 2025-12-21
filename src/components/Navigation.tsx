import { Image, Video, Upload, Settings, Home, LogOut, BarChart3, Users, FolderOpen, LogIn, Camera } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeSettings from './ThemeSettings';
import UserAvatar from './UserAvatar';
import AvatarSelector from './AvatarSelector';
import developersList from '../../developers.json';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: any; // User object passed from App component
}

export default function Navigation({ currentPage, onNavigate, user }: NavigationProps) {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Function to display user role
  const getUserRoleDisplay = (profile: any) => {
    if (!profile) return 'USER';
    
    // First check against developers.json list
    const adminEmails = developersList.admins.map(admin => admin.email);
    
    if (profile.email && adminEmails.includes(profile.email)) {
      return 'ADMIN';
    }
    
    // Check for role field (new system)
    if (profile.role) {
      switch (profile.role) {
        case 'SUPER_ADMIN':
          return 'SUPER ADMIN';
        case 'ADMIN':
          return 'ADMIN';
        case 'USER':
        default:
          return 'USER';
      }
    }
    
    // Fallback to is_admin field (legacy system)
    return profile.is_admin ? 'ADMIN' : 'USER';
  };

  // Public pages available to everyone
  const publicNavItems = [
    {
      id: 'home',
      label: t('nav.gallery'),
      icon: Home,
      description: 'Browse media gallery',
    },
    {
      id: 'images',
      label: t('nav.images'),
      icon: Image,
      description: 'Browse photos',
    },
    {
      id: 'videos',
      label: t('nav.videos'), 
      icon: Video,
      description: 'Browse videos',
    },
  ];

  // Authenticated user pages
  const authNavItems = [
    {
      id: 'upload',
      label: t('nav.upload'),
      icon: Upload,
      description: 'Add new media',
    },
    {
      id: 'class',
      label: t('nav.classMembers'),
      icon: Users,
      description: 'View class members',
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      description: 'Account & preferences',
    },
  ];

  const navItems = user ? [...publicNavItems, ...authNavItems] : publicNavItems;

  return (
    <nav className="bg-white dark:glass-dark border-b border-gray-200 dark:border-white/30 shadow-lg dark:shadow-2xl dark:shadow-white/10 relative overflow-hidden">
      <div className="matrix-bg absolute inset-0 opacity-30 hidden dark:block"></div>
      <div className="w-full relative z-10">
        <div className="flex items-center justify-between h-16 pl-2 pr-4 sm:pr-6 lg:pr-8">
          {/* Logo, Brand, and Navigation Items - All Left Aligned */}
          <div className="flex items-center gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-['Orbitron']">A5 Gallery 2.0</h1>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === item.id
                    ? 'bg-blue-100 dark:bg-white/20 text-blue-600 dark:text-white border border-blue-200 dark:border-white/40'
                    : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-200 dark:hover:border-white/20'
                } dark:backdrop-blur-sm`}
              >
                <item.icon className={`w-5 h-5 text-white ${currentPage === item.id ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]' : 'opacity-80'}`} />
                <span className="hidden lg:inline font-['Rajdhani'] font-medium tracking-wide">{item.label}</span>
                
                {/* Futuristic Tooltip */}
                <div className="lg:hidden absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-white dark:glass-dark text-gray-900 dark:text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-gray-200 dark:border-white/30">
                  {item.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-white/30"></div>
                </div>
              </button>
            ))}
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <select
              value={currentPage}
              onChange={(e) => onNavigate(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-['Rajdhani']"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-black text-gray-900 dark:text-white">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-['Rajdhani'] tracking-wide">
                      {profile?.full_name || profile?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-['Space_Grotesk']">
                      {getUserRoleDisplay(profile)}
                    </p>
                  </div>
                  <div className="relative floating-element">
                    <UserAvatar
                      profile={profile}
                      size="md"
                      onClick={() => setShowAvatarSelector(true)}
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-white/30 animate-pulse"></div>
                  </div>
                </div>

                {/* Sign Out */}
                <button
                  onClick={signOut}
                  className="group flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/20"
                  title={t('nav.disconnect')}
                >
                  <LogOut className="w-5 h-5 text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                  <span className="hidden lg:inline font-['Rajdhani'] font-medium tracking-wide">{t('nav.disconnect')}</span>
                </button>
              </>
            ) : (
              /* Sign In for Anonymous Users */
              <button
                onClick={() => onNavigate('upload')} // This will redirect to auth
                className="group flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/20"
                title={t('auth.signInToUpload')}
              >
                <LogIn className="w-5 h-5 text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                <span className="hidden lg:inline font-['Rajdhani'] font-medium tracking-wide">{t('nav.signIn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </nav>
  );
}