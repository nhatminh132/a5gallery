// Tab title management utility
let originalTitle = 'A5 Gallery 2.0';
let isTabActive = true;

export const setupTabTitleEffect = () => {
  // Set initial title
  document.title = originalTitle;

  // Handle visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab became inactive
      isTabActive = false;
      document.title = "Don't leave me pls ಥ_ಥ";
    } else {
      // Tab became active
      isTabActive = true;
      document.title = originalTitle;
    }
  };

  // Handle focus/blur events (backup for browsers that don't support visibilitychange)
  const handleBlur = () => {
    if (!document.hidden) { // Only if visibilitychange didn't fire
      setTimeout(() => {
        if (!isTabActive) {
          document.title = "Don't leave me pls ಥ_ಥ";
        }
      }, 100);
    }
  };

  const handleFocus = () => {
    isTabActive = true;
    document.title = originalTitle;
  };

  // Add event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', () => { isTabActive = false; handleBlur(); });
  window.addEventListener('focus', handleFocus);

  // Cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
  };
};

export const updateTitle = (newTitle: string) => {
  originalTitle = newTitle;
  if (isTabActive) {
    document.title = newTitle;
  }
};