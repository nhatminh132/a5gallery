import React, { useState } from 'react';
import { Info, X, Mail, Instagram, Code, Users, Heart } from 'lucide-react';
import AdScript from './AdScript';
import BannerAd from './BannerAd';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const { profile } = useAuth();
  const [showDevInfo, setShowDevInfo] = useState(false);

  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 py-8 mt-auto relative">
      {/* Subtle gradient line divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
      
      {/* Faint glow line - only in dark mode */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent blur-sm hidden dark:block"></div>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Powered by section */}
          <div className="flex items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Powered by{' '}
              <span className="neon-glow text-gray-900 dark:text-white font-semibold">
                NhatMinh
              </span>
              {' '}• AI Caption by Gemini
            </p>
            
            {/* Info Button */}
            <button
              onClick={() => setShowDevInfo(true)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Info className="w-3 h-3" />
              Info
            </button>

            {/* Send Feedback Button */}
            <a
              href="mailto:lpnminh472@gmail.com?subject=A5%20Gallery%20Feedback"
              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              title="Send Feedback"
            >
              <Mail className="w-3 h-3" />
              Send Feedback
            </a>
          </div>
          
          {/* Thanks For Visiting - Ocean blue shaking text */}
          <div className="text-center">
            <p className="text-sm font-medium text-cyan-400 dark:text-cyan-300 animate-shake"
               style={{
                 textShadow: `
                   0 0 3px #0891b2,
                   0 0 6px #0891b2,
                   0 0 10px #0891b2,
                   0 0 15px #0891b2
                 `,
                 animation: 'shake 2s infinite'
               }}>
              Thanks For Visiting
            </p>
          </div>
        </div>
      </div>

      {/* Dev Team Info Modal */}
      {showDevInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-pulse bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]">
                    Development Team
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowDevInfo(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  📧 Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">lpnminh472@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="text-gray-700 dark:text-gray-300">@noiboa5</span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 animate-spin-slow text-blue-500" />
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black text-base animate-[wave_3s_ease-in-out_infinite] tracking-wider">
                    Đội Ngũ Phát Triển
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {/* Lead Developer */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      <span className="inline-block animate-bounce">👨‍💻</span>{' '}
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                        Coder trưởng:
                      </span>
                    </h4>
                    <p className="text-sm font-bold tracking-wide">
                      <span className="super-admin-neon text-blue-400 dark:text-blue-300 animate-[super-shake_0.5s_ease-in-out_infinite] font-black text-base">
                        Lê Phước Nhật Minh
                      </span>
                    </p>
                  </div>

                  {/* Upload Support */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 dark:hover:from-green-900/30 dark:hover:to-teal-900/30 transition-all duration-300">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      <span className="inline-block animate-pulse">📤</span>{' '}
                      <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-bold animate-[shimmer_2s_ease-in-out_infinite]">
                        Hỗ trợ upload ảnh:
                      </span>
                    </h4>
                    <div className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                      <p className="transition-colors duration-300 transform">
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent font-semibold animate-pulse drop-shadow">
                          Chung Tiến Phát
                        </span>
                      </p>
                      <p className="transition-colors duration-300 transform">
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent font-semibold animate-pulse drop-shadow">
                          Phạm Phước Khoa
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Feedback Contributors */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 transition-all duration-300 hover:shadow-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      <span className="inline-block animate-wiggle">💡</span>{' '}
                      <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold animate-[glow_2s_ease-in-out_infinite_alternate]" 
                            style={{ 
                              textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                            }}>
                        Đóng góp ý kiến:
                      </span>
                    </h4>
                    <div className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                      <p className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-300 hover:font-semibold hover:scale-105 transform hover:rotate-1">
                        Trần Thiện Nhân
                      </p>
                      <p className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-300 hover:font-semibold hover:scale-105 transform hover:-rotate-1">
                        Nguyễn Quốc Huy
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thank you message */}
              <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Cảm ơn bạn đã sử dụng A5 Gallery!</span>
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Advertisement (Footer) - hidden for paid users */}
      {!profile?.no_ads && (
          <div className="mt-6 text-center flex flex-col items-center gap-3">
            {/* Popup/ad network bootstrap */}
            <AdScript src="https://pl28253750.effectivegatecpm.com/3b/88/24/3b8824afd1b31142b182b3cbe3fba24f.js" id="footer-ad" />
            {/* Banner unit */}
            <BannerAd
              keyId="2eeeda7e3770ce0b1b1242753d9b9f0a"
              format="iframe"
              width={160}
              height={300}
              loaderSrc="https://www.highperformanceformat.com/2eeeda7e3770ce0b1b1242753d9b9f0a/invoke.js"
            />
          </div>
      )}

    </footer>
  );
};

export default Footer;