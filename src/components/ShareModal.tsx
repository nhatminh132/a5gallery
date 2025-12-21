import React, { useState } from 'react';
import { X, Copy, Facebook, Twitter, Download, Link, Mail, MessageCircle } from 'lucide-react';
import { Media } from '../lib/supabase';
import { getMediaUrl } from '../lib/uploadService';
import { useLanguage } from '../contexts/LanguageContext';

interface ShareModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ media, isOpen, onClose }: ShareModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !media) return null;

  // Use media ID or fallback to database ID for sharing
  const mediaId = media.media_id || media.id;
  const shareUrl = `${window.location.origin}/?media=${mediaId}`;
  const shareText = `Check out this ${media.file_type.startsWith('image') ? 'image' : 'video'}: ${media.title}`;
  const mediaUrl = getMediaUrl(media.file_path, media.storage_provider);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(media.title)}&body=${encodedText}%20${encodedUrl}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const downloadMedia = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = media.filename || `media_${media.id}.${media.file_type.split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(mediaUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.6)] max-w-md w-full border border-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('share.shareMedia')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition border border-white text-white hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Media Preview */}
          <div className="flex items-center gap-3 p-3 bg-black rounded-lg border border-white shadow-[0_0_10px_rgba(255,255,255,0.6)]">
            <img
              src={media.thumbnail_path ? getMediaUrl(media.thumbnail_path, media.storage_provider) : mediaUrl}
              alt={media.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">{media.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{media.file_type}</p>
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('share.copyLink')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-black text-white border border-white rounded-lg text-sm shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              />
              <button
                onClick={copyToClipboard}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition border border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)] ${
                  copied
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('share.linkCopied')}</p>
            )}
          </div>

          {/* Social Sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('share.socialShare')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareToSocial('facebook')}
                className="flex items-center gap-2 px-4 py-3 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('twitter')}
                className="flex items-center gap-2 px-4 py-3 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex items-center gap-2 px-4 py-3 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => shareToSocial('email')}
                className="flex items-center gap-2 px-4 py-3 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Download */}
          <div>
            <button
              onClick={downloadMedia}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('share.downloadOriginal')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}