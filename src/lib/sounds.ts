const sounds = {
    error: '/sounds/error.mp3',
    clean: '/sounds/clean.mp3',
    popup: '/sounds/popups.mp3',
    splash: '/sounds/splash_audio.mp3',
    app: '/sounds/app_audio.mp3',
};

// Pre-instantiate splash to reduce delay
let splashAudio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    splashAudio = new Audio(sounds.splash);
    splashAudio.preload = 'auto';
}

let bgMusic: HTMLAudioElement | null = null;
// DEFAULT TO MUTED ONLY FOR BACKGROUND MUSIC
let isAppMusicMuted = true;

export const getMuteState = () => isAppMusicMuted;

export const playSound = (type: keyof typeof sounds, volume = 0.5) => {
    // UI Sounds and Splash ALWAYS play as per user request
    // Only the looping 'app' music respects the mute button state in its own logic

    try {
        if (type === 'splash' && splashAudio) {
            splashAudio.currentTime = 0;
            splashAudio.volume = volume;
            splashAudio.play().catch(() => {
                const playOnInteraction = () => {
                    splashAudio?.play().catch(() => { });
                    window.removeEventListener('mousedown', playOnInteraction);
                    window.removeEventListener('keydown', playOnInteraction);
                };
                window.addEventListener('mousedown', playOnInteraction);
                window.addEventListener('keydown', playOnInteraction);
            });
            return;
        }

        const audio = new Audio(sounds[type]);
        audio.volume = (type === 'app') ? 0.2 : volume;

        // If it's a one-shot play of 'app', we respect the mute state
        // But usually 'app' is handled by startAppMusic loop
        if (type === 'app' && isAppMusicMuted) return;

        audio.play().catch(() => { });
    } catch (err) {
        console.error("Sound failed:", err);
    }
};

export const startAppMusic = () => {
    if (bgMusic) return;

    try {
        bgMusic = new Audio(sounds.app);
        bgMusic.loop = true;
        bgMusic.volume = 0.2;
        bgMusic.muted = isAppMusicMuted;

        // No auto-play, wait for toggle
    } catch (err) {
        console.error("App music failed:", err);
    }
};

export const stopAppMusic = () => {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic = null;
    }
};

export const toggleMute = () => {
    isAppMusicMuted = !isAppMusicMuted;

    if (bgMusic) {
        bgMusic.muted = isAppMusicMuted;
        if (!isAppMusicMuted) {
            bgMusic.play().catch(() => {
                const resumeOnInteraction = () => {
                    if (bgMusic && !isAppMusicMuted) bgMusic.play().catch(() => { });
                    window.removeEventListener('mousedown', resumeOnInteraction);
                };
                window.addEventListener('mousedown', resumeOnInteraction);
            });
        }
    }

    return isAppMusicMuted;
};
