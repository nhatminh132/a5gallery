import { useEffect, useState } from 'react';
import { MessageCircle, Loader2, X } from 'lucide-react';

export default function AIFab() {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideFab, setHideFab] = useState(false);

  const injectScript = () => {
    if (loaded) {
      setOpen(true);
      try {
        (window as any).ChatflowWidget?.open?.();
      } catch {}
      return;
    }
    setLoading(true);
    const s = document.createElement('script');
    s.src = 'https://dashboard.chatflow.co/chatbot-widget.js?assistantId=1&tenantId=2a33df08-abb8-41b7-997d-9aba67832b48&teamId=1&userId=1&baseUrl=https://dashboard.chatflow.co&assistantName=nminh.';
    s.defer = true;
    s.onload = () => {
      setLoaded(true);
      setLoading(false);
      setShowPopup(false);
      setHideFab(true);
      setOpen(true);
      try {
        (window as any).ChatflowWidget?.open?.();
      } catch {}
    };
    s.onerror = () => {
      setLoading(false);
      // Keep popup open and let user retry
    };
    document.body.appendChild(s);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPopup && !loading) setShowPopup(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPopup, loading]);

  return (
    <>
      {/* Floating AI action button */}
      {!hideFab && (
        <button
          aria-label="Open AI Assistant"
          onClick={() => setShowPopup(true)}
          className="fixed bottom-6 right-6 z-50 bg-black border border-white text-white rounded-full p-4 shadow-lg cyber-button neon-white hover:scale-105"
          title="AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Popup notification */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto mb-16 mr-2 max-w-sm w-full bg-black border border-white rounded-xl p-4 neon-white shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-white font-semibold neon-white mb-1">Calling AI Agent</h3>
                <p className="text-white/80 text-sm">
                  {loading ? 'Connecting to assistant...' : 'Connect to the AI assistant now?'}
                </p>
              </div>
              {!loading && (
                <button
                  aria-label="Close"
                  onClick={() => setShowPopup(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 justify-end">
              {!loading ? (
                <>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="px-3 py-2 bg-black border border-white text-white rounded cyber-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={injectScript}
                    className="px-3 py-2 bg-black border border-white text-white rounded cyber-button"
                  >
                    Connect
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
