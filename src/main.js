import './style.css';
import { AudioEngine } from './audio/AudioEngine.js';
import { PitchDetector } from './audio/PitchDetector.js';
import { SONG_LIBRARY } from './models/SongLibrary.js';
import { PracticeEngine } from './practice/PracticeEngine.js';
import { AppUI } from './ui/AppUI.js';
import { registerPWA } from './pwa/registerServiceWorker.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.querySelector('#app');
  if (!appContainer) return;

  const audioEngine = new AudioEngine();
  const pitchDetector = new PitchDetector();
  const practiceEngine = new PracticeEngine(audioEngine, SONG_LIBRARY);

  const appUI = new AppUI(appContainer, audioEngine, pitchDetector, practiceEngine);

  const pwaInstaller = registerPWA((promptEvent) => {
    const installBtn = document.querySelector('#btn-pwa-install');
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.addEventListener('click', async () => {
        await pwaInstaller.promptInstall();
        installBtn.classList.add('hidden');
      });
    }
  });

  appUI.init(pwaInstaller);
});
