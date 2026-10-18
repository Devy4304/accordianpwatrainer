// PWA Service Worker Registration & Installation Manager

export function registerPWA(onInstallAvailable = () => {}) {
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onInstallAvailable(deferredPrompt);
  });

  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Accordion PWA Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('PWA Service Worker registration failed:', err);
      });
    });
  }

  return {
    promptInstall: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        return outcome === 'accepted';
      }
      return false;
    }
  };
}
