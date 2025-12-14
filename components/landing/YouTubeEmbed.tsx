import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubeEmbedProps {
    videoId: string;
    className?: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        // 1. Function to create the player
        const createPlayer = () => {
            if (!containerRef.current || !window.YT) return;

            const player = new window.YT.Player(containerRef.current, {
                videoId: videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3, // Hide annotations
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                    mute: 1,
                    loop: 0, // No looping, freeze at end
                },
                events: {
                    onReady: (event: any) => {
                        event.target.mute();
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        // Do not rely on ENDED state (0) as it triggers overlay
                    },
                },
            });

            playerRef.current = player;

            // Interval to check time and pause before end
            const timeUpdateInterval = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();

                    // Pause 0.4s before end to avoid "Replay" overlay
                    if (duration > 0 && duration - currentTime <= 0.4) {
                        playerRef.current.pauseVideo();
                        clearInterval(timeUpdateInterval);
                    }
                }
            }, 100);

            // Cleanup interval when component unmounts - we attach this to the playerRef for cleanup? 
            // Better: attach to a ref or just rely on the main cleanup effect?
            // The main cleanup function needs access to this interval ID. 
            // We can store it in a ref or simply clear it in the return of createPlayer? 
            // Actually, useEffect cleanup is what runs. We need to store this interval ID.
            // Let's attach it to the window or a ref.
            (playerRef.current as any)._timeInterval = timeUpdateInterval;
        };

        // 2. Load API if not loaded
        if (!window.YT) {
            if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            }
        }

        // 3. Robust Initialization Loop
        const interval = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(interval);
                createPlayer();
            }
        }, 100);

        // 4. Cleanup
        return () => {
            clearInterval(interval);
            if (playerRef.current) {
                try {
                    if ((playerRef.current as any)._timeInterval) {
                        clearInterval((playerRef.current as any)._timeInterval);
                    }
                    playerRef.current.destroy();
                } catch (e) {
                    // Ignore destroy errors
                }
            }
        };
    }, [videoId]);

    return <div ref={containerRef} className={className} />;
};
