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
    loop?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId, className, loop = false }) => {
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
                    loop: loop ? 1 : 0,
                    playlist: loop ? videoId : undefined,
                },
                events: {
                    onReady: (event: any) => {
                        event.target.mute();
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (loop && event.data === 0) { // ENDED
                             event.target.playVideo();
                        }
                    },
                },
            });

            playerRef.current = player;

            // Interval to check time and pause before end (Only if NOT looping)
            if (!loop) {
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
                (playerRef.current as any)._timeInterval = timeUpdateInterval;
            }
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
