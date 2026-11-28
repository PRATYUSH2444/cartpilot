import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  userName: string;
  userInitial: string;
  onSaveAvatar: (newAvatarUrl: string) => Promise<boolean>;
}

const PRESET_AVATARS = [
  {
    id: 'chef',
    label: 'Artisan Chef',
    url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'farmer',
    label: 'Organic Farmer',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'shopper',
    label: 'Green Shopper',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'gourmet',
    label: 'Culinary Gourmet',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'wellness',
    label: 'Wellness Pro',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'vip',
    label: 'Emerald VIP',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
];

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl = '',
  userName,
  userInitial,
  onSaveAvatar,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatarUrl || '');
      setErrorMessage(null);
      setIsLiveCameraActive(false);
    } else {
      stopLiveCamera();
    }
  }, [isOpen, currentAvatarUrl]);

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const handleStartLiveCamera = async () => {
    setErrorMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native capture input on unsupported environments
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsLiveCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      // If camera access is denied or unavailable, use native camera file input
      cameraInputRef.current?.click();
    }
  };

  const handleCaptureFromWebcam = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = 360;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const minDim = Math.min(video.videoWidth || 640, video.videoHeight || 640);
      const startX = ((video.videoWidth || 640) - minDim) / 2;
      const startY = ((video.videoHeight || 640) - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPreviewUrl(dataUrl);
      stopLiveCamera();
    } catch {
      setErrorMessage('Failed to capture photo from camera. Try choosing from gallery.');
      stopLiveCamera();
    }
  };

  const compressAndProcessFile = (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 360;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setPreviewUrl(e.target?.result as string);
            setIsProcessing(false);
            return;
          }

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(compressed);
        } catch {
          setPreviewUrl(e.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Failed to process image file. Please choose another image.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    compressAndProcessFile(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const ok = await onSaveAvatar(previewUrl);
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Failed to save profile photo. Please try again.');
      }
    } catch {
      setErrorMessage('Network error saving photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    stopLiveCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white leading-tight">
                Profile Photo
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Upload, capture, or select an avatar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Interactive Live Viewfinder or Circular Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            {isLiveCameraActive ? (
              <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror scale-x-[-1]"
                />
                <button
                  type="button"
                  onClick={handleCaptureFromWebcam}
                  className="absolute bottom-2.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Take Photo
                </button>
              </div>
            ) : (
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-stone-200 dark:border-stone-700 p-1 bg-stone-50 dark:bg-stone-950 shadow-md flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={userName}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setPreviewUrl('')}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-stone-950 dark:bg-stone-800 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center">
                      {userInitial}
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                  )}
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-600 text-white shadow-md border-2 border-white dark:border-stone-900 flex items-center justify-center hover:bg-rose-500 cursor-pointer transition-transform hover:scale-110"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <p className="mt-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              {userName}
            </p>
          </div>

          {/* Action Buttons: Camera & Upload */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleStartLiveCamera}
              className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-2xs"
            >
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Upload File</span>
            </button>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Curated Luxury Avatars Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Or Select a Curated Avatar
              </span>
              <span className="text-[10px] text-stone-400">1-Tap Apply</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = previewUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setPreviewUrl(preset.url);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                        : 'border-stone-200 dark:border-stone-800 hover:border-emerald-400'
                    }`}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessing}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-102 active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
