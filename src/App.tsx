import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Auth from './components/Auth';
import AuthCallback from './components/AuthCallback';
import LoadingDebug from './components/LoadingDebug';
import Dashboard from './pages/Dashboard';
import Images from './pages/Images';
import Videos from './pages/Videos';
import Albums from './pages/Albums';
import Upload from './pages/Upload';
import ClassMembers from './pages/ClassMembers';
import Settings from './pages/Settings';
import Gallery from './pages/Gallery';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { Media, supabase } from './lib/supabase';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import AIFab from './components/AIFab';

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [loadingSharedMedia, setLoadingSharedMedia] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current page from URL
  const currentPage = location.pathname.substring(1) || 'home';
  
  // Check for shared media parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mediaId = searchParams.get('media');
    
    if (mediaId && !selectedMedia) {
      fetchSharedMedia(mediaId);
    }
  }, [location.search, selectedMedia]);
  
  const fetchSharedMedia = async (mediaId: string) => {
    setLoadingSharedMedia(true);
    try {
      // First try to find by media_id, then by id
      let { data: media } = await supabase
        .from('media')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('media_id', mediaId)
        .single();
      
      // If not found by media_id, try by database id
      if (!media) {
        const { data: mediaById } = await supabase
          .from('media')
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('id', mediaId)
          .single();
        media = mediaById;
      }
      
      if (media) {
        setSelectedMedia(media);
        // Update URL to remove the media parameter to clean up the URL
        navigate(location.pathname, { replace: true });
      } else {
        console.error('Shared media not found:', mediaId);
      }
    } catch (error) {
      console.error('Error fetching shared media:', error);
    } finally {
      setLoadingSharedMedia(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Initializing..." size="lg" fullScreen />;
  }

  if (loadingSharedMedia) {
    return <LoadingSpinner message="Loading shared media..." size="lg" fullScreen />;
  }

  // Only require authentication for upload and user-specific pages
  const requiresAuth = ['upload', 'settings', 'class'].includes(currentPage);
  
  if (!user && requiresAuth) {
    return <Auth />;
  }

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
    setSelectedMedia(null); // Clear selected media when navigating
  };

  const handleUploadComplete = () => {
    // Refresh data and navigate back to dashboard after upload
    navigate('/home');
  };

  if (selectedMedia) {
    return (
      <Gallery
        initialMedia={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} user={user} />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/auth/callback" element={
            <AuthCallback onComplete={() => handleNavigate('home')} />
          } />
          <Route path="/home" element={
            <Dashboard 
              onMediaSelect={setSelectedMedia}
              onNavigate={handleNavigate}
            />
          } />
          <Route path="/images" element={
            <Images
              onMediaSelect={setSelectedMedia}
              onNavigate={handleNavigate}
            />
          } />
          <Route path="/videos" element={
            <Videos
              onMediaSelect={setSelectedMedia}
              onNavigate={handleNavigate}
            />
          } />
          <Route path="/upload" element={
            user ? (
              <Upload
                onNavigate={handleNavigate}
                onUploadComplete={handleUploadComplete}
              />
            ) : (
              <Auth />
            )
          } />
          <Route path="/class" element={
            user ? (
              <ClassMembers
                onNavigate={handleNavigate}
              />
            ) : (
              <Auth />
            )
          } />
          <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
          <Route path="/settings/*" element={
            user ? (
              <Settings
                onNavigate={handleNavigate}
              />
            ) : (
              <Auth />
            )
          } />
          <Route path="/admin" element={
            user ? (
              <AdminPanel />
            ) : (
              <Auth />
            )
          } />
        </Routes>
      </main>
      
      <Footer />
      <LoadingDebug />
      {/* On-demand AI widget */}
      <AIFab />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
