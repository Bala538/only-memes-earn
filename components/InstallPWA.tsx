import React, { useState, useEffect } from 'react';
import { DownloadIcon, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 z-50 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
          <DownloadIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Install App</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add to home screen for quick access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Install
        </button>
        <button 
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
