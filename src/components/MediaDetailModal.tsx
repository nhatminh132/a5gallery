import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Image as ImageIcon, Video, Download, Copy, Maximize, Minimize, Share2, ChevronDown, ChevronRight, Pencil, Sparkles, Check, Loader2 } from 'lucide-react';
import CommentsLikes from './CommentsLikes';
import ShareModal from './ShareModal';
import { Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { deleteMedia } from '../lib/uploadService';
import { formatFileSize, isVideoFile } from '../lib/fileUtils';
import { getMediaUrl } from '../lib/uploadService';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeUserText } from '../lib/textSafety';
import { moderateText, caption as aiCaption, checkCaptionAccess, recordCaptionUsage } from '../lib/aiClient';
import { useToast } from '../contexts/ToastContext';
import FavoriteButton from './FavoriteButton';

interface MediaDetailModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaDetailModal({ media, isOpen, onClose }: MediaDetailModalProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const canEdit = !!user && (profile?.is_admin || user.id === media?.user_id);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showUploadInfo, setShowUploadInfo] = useState(false);
  const [descValue, setDescValue] = useState<string>('');
  const [generatingCaption, setGeneratingCaption] = useState<boolean>(false);
  const [hasSuggested, setHasSuggested] = useState<boolean>(false);
  const [savingDesc, setSavingDesc] = useState<boolean>(false);
  const [showCaptionAssistant, setShowCaptionAssistant] = useState<boolean>(false);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [savedCaption, setSavedCaption] = useState<string>('');

  // Reset caption state when media changes
  useEffect(() => {
    if (media && media.id !== currentMediaId) {
      // New image opened, reset caption state
      setDescValue('');
      setHasSuggested(false);
      setGeneratingCaption(false);
      setHasUnsavedChanges(false);
      setSavedCaption('');
      setCurrentMediaId(media.id);
    }
  }, [media?.id]);

 // Inline editable title component for owner/admin
 const EditableTitle: React.FC<{ media: Media; canEdit: boolean }> = ({ media, canEdit }) => {
   const [editing, setEditing] = useState(false);
   const [value, setValue] = useState(media.title);
   const [saving, setSaving] = useState(false);

   const saveTitle = async () => {
     if (!canEdit) return setEditing(false);
     const newTitle = value.trim();
     if (!newTitle || newTitle === media.title) {
       setEditing(false);
       return;
     }
     try {
       setSaving(true);
       // AI moderation for title (block if toxic)
       try {
         const mod = await moderateText(newTitle);
         if (mod.isToxic) {
           toast.error(`Title blocked due to toxic content. Reasons: ${mod.reasons.join(', ')}`);
           setSaving(false);
           return;
         }
       } catch (e) {
         console.warn('AI moderation unavailable for title, proceeding with local checks.', e);
       }
       const local = await sanitizeUserText(newTitle);
       if (!local.safe) {
         toast.error('Title contains inappropriate language.');
         setSaving(false);
         return;
       }
       const { error } = await supabase
         .from('media')
         .update({ title: newTitle })
         .eq('id', media.id);
       if (error) throw error;
       toast.success('Media renamed successfully!');
     } catch (e) {
       console.error('Rename failed:', e);
       toast.error('Failed to rename media.');
     } finally {
       setSaving(false);
       setEditing(false);
     }
   };

   if (!canEdit) {
     return <h2 className="text-xl font-bold text-gray-900 dark:text-white">{media.title}</h2>;
   }

   return (
     <div className="flex items-center gap-2">
       {editing ? (
         <>
           <input
             id="editable-title-input"
             value={value}
             onChange={(e) => setValue(e.target.value)}
             className="text-xl font-bold bg-white dark:bg-black border-b border-gray-300 dark:border-white focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/70"
             autoFocus
             onKeyDown={(e) => {
               if (e.key === 'Enter') saveTitle();
               if (e.key === 'Escape') setEditing(false);
             }}
             onBlur={saveTitle}
           />
           {saving && <span className="text-sm text-gray-500">Saving...</span>}
         </>
       ) : (
         <button
           className="text-left text-xl font-bold text-gray-900 dark:text-white hover:underline"
           onClick={() => setEditing(true)}
           title="Click to rename"
         >
           {media.title}
         </button>
       )}
     </div>
   );
 };

 
  if (!isOpen || !media) return null;

  const mediaUrl = getMediaUrl(media.file_path, media.storage_provider);
  const thumbnailUrl = media.thumbnail_path ? getMediaUrl(media.thumbnail_path, media.storage_provider) : mediaUrl;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback - you could replace with toast notification
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = media.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleCloseModal = () => {
    setIsFullScreen(false);
    onClose();
  };

  // Heuristic local captioning retained as a fallback
async function suggestCaptionFromImageUrl(url: string, hint?: string): Promise<string> {
    // Analyze basic visual cues using canvas: orientation, brightness, dominant color grid, and face-like regions (very rough)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('failed_to_load_image'));
      i.src = url;
    });

    const maxSide = 256;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'Photo';
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // Sampling step (coarser = faster)
    const step = Math.max(1, Math.floor(Math.min(w, h) / 64));

    // Accumulators
    let sumBrightness = 0;
    let sumSaturation = 0;
    let count = 0;

    // Heuristic counters
    let skinLike = 0;
    let blueUpper = 0; // sky/water likely
    let greenish = 0;  // vegetation
    let reddish = 0;   // people/food/warm

    // Simple gradient magnitude to estimate texture/detail (saliency proxy)
    let gradSum = 0;

    // Helper: RGB -> HSV quick conversion
    const toHSV = (r: number, g: number, b: number) => {
      const rf = r / 255, gf = g / 255, bf = b / 255;
      const max = Math.max(rf, gf, bf);
      const min = Math.min(rf, gf, bf);
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        if (max === rf) h = ((gf - bf) / d) % 6;
        else if (max === gf) h = (bf - rf) / d + 2;
        else h = (rf - gf) / d + 4;
        h *= 60; if (h < 0) h += 360;
      }
      const s = max === 0 ? 0 : d / max;
      const v = max;
      return { h, s, v };
    };

    const lumAt = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const bright = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sumBrightness += bright;
        const { h: H, s: S, v: V } = toHSV(r, g, b);
        sumSaturation += S;
        count++;

        // Skin-tone heuristic in HSV (rough)
        if (S > 0.2 && V > 0.2 && ((H >= 0 && H <= 50) || (H >= 330 && H <= 360))) skinLike++;

        // Blue dominance in upper half -> sky/water
        if (y < h / 2 && H >= 180 && H <= 250 && S > 0.2) blueUpper++;

        // Greenish -> vegetation
        if (H >= 70 && H <= 170 && S > 0.25) greenish++;

        // Reddish -> people/food/warm scenes
        if ((H <= 25 || H >= 340) && S > 0.25) reddish++;

        // Gradient (Sobel-like 1D approximation)
        const l = lumAt(Math.min(w - 1, x + 1), y) - lumAt(Math.max(0, x - 1), y);
        const t = lumAt(x, Math.min(h - 1, y + 1)) - lumAt(x, Math.max(0, y - 1));
        gradSum += Math.abs(l) + Math.abs(t);
      }
    }

    const avgBrightness = count ? sumBrightness / count : 128;
    const avgSaturation = count ? sumSaturation / count : 0.3;
    const avgGrad = gradSum / Math.max(1, (Math.ceil(h / step) * Math.ceil(w / step)));

    // Labels
    const orientation = w >= h ? 'landscape' : 'portrait';
    const brightnessLabel = avgBrightness > 170 ? 'bright' : avgBrightness < 85 ? 'low-light' : 'evenly lit';
    const vividLabel = avgSaturation > 0.5 ? 'vivid' : avgSaturation < 0.2 ? 'muted' : 'natural';

    // Content heuristics
    const skinRatio = skinLike / Math.max(1, count);
    const skyRatio = blueUpper / Math.max(1, count);
    const greenRatio = greenish / Math.max(1, count);
    const redRatio = reddish / Math.max(1, count);

    const tags: string[] = [];
    if (skinRatio > 0.08) tags.push('portrait');
    if (skyRatio > 0.06) tags.push('sky');
    if (greenRatio > 0.08) tags.push('nature');
    if (redRatio > 0.08 && skinRatio < 0.05) tags.push('warm tones');
    if (avgGrad > 25) tags.push('detailed');

    // Scene guess
    let scene = 'photo';
    if (tags.includes('portrait')) scene = 'portrait photo';
    else if (tags.includes('nature') && tags.includes('sky')) scene = 'outdoor nature scene';
    else if (tags.includes('nature')) scene = 'nature photo';
    else if (tags.includes('sky')) scene = 'outdoor scene';

    // Subject guess from hint keywords
    const cleanedHint = (hint || '').toLowerCase();
    const hintWords = cleanedHint.split(/[^a-z0-9]+/).filter(Boolean);
    const kw = new Set(hintWords);
    const subjectMap: Record<string, string> = {
      cat: 'cat', kitten: 'cat', dog: 'dog', puppy: 'dog', bird: 'bird', flower: 'flower', rose: 'flower',
      tree: 'tree', beach: 'beach', sea: 'sea', ocean: 'sea', sky: 'sky', city: 'city street', street: 'city street',
      car: 'car', bike: 'bicycle', mountain: 'mountain', food: 'meal', pizza: 'pizza', burger: 'burger', people: 'people', person: 'person'
    };
    let subject: string | null = null;
    for (const [k, v] of Object.entries(subjectMap)) {
      if (kw.has(k)) { subject = v; break; }
    }

    // Fallback subject from heuristics
    if (!subject) {
      if (tags.includes('portrait')) subject = 'person';
      else if (tags.includes('nature') && tags.includes('sky')) subject = 'landscape';
      else if (tags.includes('nature')) subject = 'trees';
      else if (tags.includes('sky')) subject = 'sky and clouds';
      else subject = 'scene';
    }

    // Indoors/outdoors guess
    const place = (tags.includes('nature') || tags.includes('sky')) ? 'outdoors' : 'indoors';

    // Templates for variety
    const templates = [
      (s: string) => `${brightnessLabel}, ${vividLabel} ${orientation} ${s} ${place}`,
      (s: string) => `${s} ${place} in a ${brightnessLabel}, ${vividLabel} setting`,
      (s: string) => `${brightnessLabel} ${s} ${place} with ${vividLabel} colors`,
      (s: string) => `${vividLabel} ${orientation} ${s} ${place}`,
      (s: string) => `${s} ${place}, ${brightnessLabel} and ${vividLabel}`,
    ];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    let sentence = pick(templates)(subject);

    // Add detail phrases based on tags
    const details: string[] = [];
    if (tags.includes('portrait')) details.push('subject in focus');
    if (tags.includes('sky')) details.push('open sky');
    if (tags.includes('nature')) details.push('natural elements');
    if (tags.includes('detailed')) details.push('fine details visible');

    if (details.length) {
      sentence += `, ${pick(details)}`;
    }

    return sentence;
  }

  // Full-screen image view
  if (isFullScreen && !isVideoFile(media.file_type)) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <img
          src={mediaUrl}
          alt={media.title}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Full-screen controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            title="Exit Full Screen"
          >
            <Minimize className="w-6 h-6" />
          </button>
          <button
            onClick={handleCloseModal}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Full-screen info overlay */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold">{media.title}</h3>
          <p className="text-sm opacity-80">
            🆔 ID: {media.media_id} | 📐 {media.width}×{media.height} | 📦 {formatFileSize(media.file_size)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-black rounded-xl sm:rounded-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col border border-gray-300 dark:border-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-300 dark:border-white flex-shrink-0 bg-white dark:bg-black">
          <div className="flex items-center gap-3 text-gray-900 dark:text-white">
            {isVideoFile(media.file_type) ? (
              <Video className="w-6 h-6 text-red-500" />
            ) : (
              <ImageIcon className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <EditableTitle media={media} canEdit={!!user && (profile?.is_admin || user.id === media.user_id)} />
              <p className="text-sm text-gray-500 dark:text-gray-400">Media Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Owner/Admin actions in modal header */}
            {user && (profile?.is_admin || user.id === media.user_id) && (
              <>
                <button
                  onClick={() => {
                    const el = document.getElementById('editable-title-input');
                    if (el) (el as HTMLInputElement).focus();
                  }}
                  className="flex items-center gap-1 px-3 py-2 border border-white text-white rounded-lg hover:bg-white/10 transition"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm">Rename</span>
                </button>

                <button
                  onClick={async () => {
                    if (!confirm('Delete this media? This cannot be undone.')) return;
                    const success = await deleteMedia(media.id, media.file_path, media.thumbnail_path, media.storage_provider);
                    if (success) {
                      toast.success('Media deleted successfully!');
                      onClose();
                    } else {
                      toast.error('Failed to delete media.');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 border border-white text-white rounded-lg hover:bg-white/10 transition"
                  title="Delete"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </>
            )}
            {!isVideoFile(media.file_type) && (
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-lg transition border border-gray-300 dark:border-white text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                title="View Full Screen"
              >
                <Maximize className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleCloseModal}
              className="p-2 rounded-lg transition border border-gray-300 dark:border-white text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Media Preview */}
          <div className="lg:w-1/2 bg-gray-50 dark:bg-black flex items-center justify-center p-3 sm:p-6">
            {isVideoFile(media.file_type) ? (
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-32 sm:max-h-96 rounded-lg shadow-lg"
                poster={thumbnailUrl}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={media.title}
                className="max-w-full max-h-32 sm:max-h-96 rounded-lg shadow-lg object-contain"
              />
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:w-1/2 p-3 sm:p-6 flex-1 overflow-y-auto">
            <div className="space-y-3 sm:space-y-6">
              {/* Media Information - Collapsible */}
              {/* Caption Display/Editor - Everyone can view, only admin/owner can edit */}
              {!isVideoFile(media.file_type) && (
                <div className="mb-4 p-3 rounded-lg border border-gray-300 dark:border-white bg-white dark:bg-black text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {canEdit && savingDesc && (
                        <span className="text-xs text-blue-400">● Saving...</span>
                      )}
                      {canEdit && !savingDesc && !hasUnsavedChanges && hasSuggested && (
                        <span className="text-xs text-green-400">● Saved</span>
                      )}
                      {canEdit && hasUnsavedChanges && (
                        <span className="text-xs text-yellow-400">● Unsaved</span>
                      )}
                      {canEdit && !hasSuggested && !hasUnsavedChanges && descValue && (
                        <span className="text-xs text-gray-400">● Editing</span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setShowCaptionAssistant(!showCaptionAssistant)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-white text-gray-900 dark:text-white rounded hover:bg-gray-100 dark:hover:bg-white/10 transition"
                      >
                        <Pencil className="w-3 h-3" />
                        {showCaptionAssistant ? 'Close' : 'Edit'}
                      </button>
                    )}
                  </div>
                  
                  {/* Show caption text when collapsed OR for non-editors */}
                  {(!showCaptionAssistant || !canEdit) && (
                    <div className="mt-2">
                      {(descValue || media.description) ? (
                        <p className="text-sm text-gray-600 dark:text-white/80 italic">
                          "{descValue || media.description}"
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-white/50 italic">
                          {canEdit ? 'No caption yet. Click "Edit" to add one.' : 'No caption available.'}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Caption editor - shown when Edit is clicked (only for admin/owner) */}
                  {showCaptionAssistant && canEdit && (
                    <div className="space-y-2 mt-3">
                      <textarea
                        value={descValue || media.description || ''}
                        onChange={(e) => {
                          setDescValue(e.target.value);
                          // Mark as unsaved if user edits after generation
                          if (hasSuggested && e.target.value !== savedCaption) {
                            setHasUnsavedChanges(true);
                          }
                        }}
                        placeholder="Describe this image for accessibility (alt text)."
                        className="w-full p-2 rounded-md border border-gray-300 dark:border-white bg-white dark:bg-black text-gray-900 dark:text-white text-sm"
                        rows={3}
                      />
                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs">
                          <span>⚠️ You have unsaved changes</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={async () => {
                            try {
                              setGeneratingCaption(true);
                              
                              // Check with NM GUARD BETA before allowing caption generation
                              if (user) {
                                const guardCheck = await checkCaptionAccess(user.id, user.email || undefined);
                                
                                if (!guardCheck.allowed) {
                                  toast.error(guardCheck.reason || 'AI Captioner access denied');
                                  setGeneratingCaption(false);
                                  return;
                                }
                                
                                // Show remaining count to user
                                if (guardCheck.remaining !== undefined && guardCheck.remaining !== Infinity) {
                                  if (guardCheck.remaining <= 1) {
                                    toast.warning(`⚠️ Last AI caption for today! (${guardCheck.remaining} remaining)`);
                                  } else if (guardCheck.message) {
                                    toast.info(guardCheck.message);
                                  }
                                }
                              }
                              
                               let suggestion: string;
try {
  // Prefer a short-lived signed URL so the AI worker can fetch private media
  let imgUrl = getMediaUrl(media.file_path, media.storage_provider);
  try {
    imgUrl = await getSignedUrl(media.storage_provider as any, media.file_path, 300);
  } catch (signErr) {
    console.warn('Signed URL generation failed; using public URL.', signErr);
  }
  const { caption } = await aiCaption(imgUrl);
  suggestion = caption;
  
  // Record usage with NM GUARD BETA after successful AI caption
  if (user) {
    await recordCaptionUsage(user.id);
  }
} catch (e) {
  console.warn('AI caption endpoint failed, falling back to heuristic.', e);
  suggestion = await suggestCaptionFromImageUrl(getMediaUrl(media.file_path, media.storage_provider), media.title);
  // Don't record usage for fallback heuristic caption
}
                              setHasSuggested(true);
                              // Typewriter effect
                              setDescValue('');
                              const chars = suggestion.split('');
                              let i = 0;
                              const timer = setInterval(() => {
                                i++;
                                setDescValue(suggestion.slice(0, i));
                                if (i >= chars.length) {
                                  clearInterval(timer);
                                  // Auto-save after typewriter effect completes
                                  setTimeout(async () => {
                                    try {
                                      setSavingDesc(true);
                                      const { error } = await supabase
                                        .from('media')
                                        .update({ description: suggestion })
                                        .eq('id', media.id);
                                      if (error) throw error;
                                      setSavedCaption(suggestion);
                                      setHasUnsavedChanges(false);
                                      console.log('✓ Caption auto-saved');
                                      toast.success('Caption saved!');
                                    } catch (e) {
                                      console.error('Auto-save failed:', e);
                                      toast.error('Failed to save caption');
                                    } finally {
                                      setSavingDesc(false);
                                    }
                                  }, 500);
                                }
                              }, 25);
                            } catch (e) {
                              console.error(e);
                              toast.error('Failed to generate caption suggestion.');
                            } finally {
                              setGeneratingCaption(false);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-white text-gray-900 dark:text-white rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          {generatingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {generatingCaption ? 'Generating...' : (hasSuggested ? 'Regenerate' : 'Generate')}
                        </button>
                        <button
                          onClick={async () => {
                            if (!canEdit) {
                              toast.warning('You do not have permission to edit this media.');
                              return;
                            }
                            const text = (descValue || '').trim();
                            // AI moderation (block if toxic)
                            try {
                              const mod = await moderateText(text);
                              if (mod.isToxic) {
                                toast.error(`Description blocked due to toxic content. Reasons: ${mod.reasons.join(', ')}`);
                                return;
                              }
                            } catch (e) {
                              console.warn('AI moderation unavailable, using local check.', e);
                            }
                            
                            // Local fallback
                            const safety = await sanitizeUserText(text);
                            if (!safety.safe) {
                              toast.error('Description contains inappropriate language. Please edit and try again.');
                              return;
                            }
                            if (!text) {
                              toast.warning('Nothing to save.');
                              return;
                            }
                            try {
                              setSavingDesc(true);
                              const { error } = await supabase.from('media').update({ description: text }).eq('id', media.id);
                              if (error) throw error;
                              setSavedCaption(text);
                              setHasUnsavedChanges(false);
                              toast.success('Description updated successfully!');
                            } catch (e) {
                              console.error(e);
                              toast.error('Failed to save description.');
                            } finally {
                              setSavingDesc(false);
                            }
                          }}
                          disabled={!canEdit || savingDesc}
                          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 ${
                            hasUnsavedChanges 
                              ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400 hover:border-yellow-300' 
                              : 'border-gray-300 dark:border-white text-gray-900 dark:text-white'
                          }`}
                          title={!canEdit ? 'Only the owner or an admin can save.' : 'Save caption'}
                        >
                          {savingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={async () => {
                            if (!canEdit) {
                              toast.warning('You do not have permission to edit this media.');
                              return;
                            }
                            if (!confirm('Clear the caption/description?')) return;
                            try {
                              setSavingDesc(true);
                              const { error } = await supabase.from('media').update({ description: null }).eq('id', media.id);
                              if (error) throw error;
                              setDescValue('');
                              toast.success('Description cleared.');
                            } catch (e) {
                              console.error(e);
                              toast.error('Failed to clear description.');
                            } finally {
                              setSavingDesc(false);
                            }
                          }}
                          disabled={!canEdit || savingDesc}
                          className="flex items-center gap-2 px-3 py-2 border border-red-400 dark:border-red-300 text-red-600 dark:text-red-300 rounded-lg transition hover:bg-red-100 dark:hover:bg-red-500/10 disabled:opacity-50"
                          title={!canEdit ? 'Only the owner or an admin can clear.' : 'Clear description'}
                        >
                          <X className="w-4 h-4" />
                          Clear
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/70">
                        AI-generated captions are <strong>auto-saved</strong>. You can edit and save again if needed.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Media Information - Collapsible */}
              <div>
                <button
                  onClick={() => setShowBasicInfo(!showBasicInfo)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    📋 {t('modal.mediaInformation')}
                  </h3>
                  {showBasicInfo ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {showBasicInfo && (
                  <div className="mt-3 space-y-4 text-gray-900 dark:text-white">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-white/80">{t('modal.title')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white" title={media.title}>
                          {media.title.length > 20 ? `${media.title.substring(0, 20)}...` : media.title}
                        </p>
                      </div>
                      {media.description && (
                        <div>
                          <span className="text-gray-600 dark:text-white/80">{t('modal.description')}:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{media.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Media Identification */}
                    <div className="border-t border-gray-300 dark:border-white pt-4 text-gray-900 dark:text-white">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        🆔 {t('modal.identification')}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-white/80">{t('modal.mediaId')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-100 dark:bg-black text-gray-900 dark:text-white px-2 py-1 rounded border border-gray-300 dark:border-white">
                              {media.media_id || 'No ID'}
                            </span>
                            {media.media_id && (
                              <button
                                onClick={() => copyToClipboard(media.media_id!, 'Media ID')}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                                title={t('modal.copyMediaId')}
                              >
                                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-white/80">{t('modal.databaseId')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-600 dark:text-white/80">
                              {media.id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(media.id, 'Database ID')}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                              title={t('modal.copyDatabaseId')}
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Upload Information - Collapsible */}
              <div>
                <button
                  onClick={() => setShowUploadInfo(!showUploadInfo)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-black border border-gray-300 dark:border-white rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    📅 {t('modal.uploadInformation')}
                  </h3>
                  {showUploadInfo ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {showUploadInfo && (
                  <div className="mt-3 grid grid-cols-1 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('modal.uploadDate')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(media.upload_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('modal.uploadedBy')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {media.profiles?.full_name || media.profiles?.email || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <FavoriteButton mediaId={media.id} size="md" showLabel />
                  <button
                    onClick={downloadMedia}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white text-gray-900 dark:text-white rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                    {t('modal.downloadOriginal')}
                  </button>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white text-gray-900 dark:text-white rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('modal.share')}
                  </button>
                </div>
              </div>

              {/* Comments and Likes Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <CommentsLikes media={media} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        media={media}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}