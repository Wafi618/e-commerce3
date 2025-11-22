import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const DIVISIONS = {
    Dhaka: { lat: 23.8103, lng: 90.4125 },
    Chittagong: { lat: 22.3569, lng: 91.7832 },
    Khulna: { lat: 22.8456, lng: 89.5403 },
    Rajshahi: { lat: 24.3636, lng: 88.6241 },
    Barisal: { lat: 22.7010, lng: 90.3535 },
    Sylhet: { lat: 24.8949, lng: 91.8687 },
    Rangpur: { lat: 25.7439, lng: 89.2752 },
    Mymensingh: { lat: 24.7471, lng: 90.4203 },
};

type Mode = 'time' | 'prayer' | 'news';

export const TopTicker = () => {
    const [mode, setMode] = useState<Mode>('time');
    const [time, setTime] = useState('');
    const [division, setDivision] = useState('Dhaka');
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [nextPrayer, setNextPrayer] = useState('');
    const [news, setNews] = useState('Welcome to Star Accessories');
    const [cycleCount, setCycleCount] = useState(0);

    // Refs for measuring width
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(0);
    const [startAnimation, setStartAnimation] = useState(false);

    // Time Update
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Dhaka',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Mode Switching Logic
    const switchMode = useCallback(() => {
        setMode(prev => {
            if (prev === 'time') return 'prayer';
            if (prev === 'prayer') return 'news';
            return 'time';
        });
        setCycleCount(0);
        setStartAnimation(false);
    }, []);

    // Time Mode Timer
    useEffect(() => {
        if (mode === 'time') {
            const timer = setTimeout(switchMode, 10000);
            return () => clearTimeout(timer);
        }
    }, [mode, switchMode]);

    // Animation Setup for Prayer/News
    useEffect(() => {
        if (mode !== 'time') {
            if (contentRef.current && containerRef.current) {
                const contentWidth = contentRef.current.offsetWidth;
                const containerWidth = containerRef.current.offsetWidth;
                const isMobile = window.innerWidth < 768;
                const speed = isMobile ? 100 : 50; // px per second

                const distance = containerWidth + contentWidth;
                const calculatedDuration = distance > 0 ? distance / speed : 10;

                setDuration(calculatedDuration);

                // Small delay to ensure DOM is ready
                const timer = setTimeout(() => {
                    setStartAnimation(true);
                }, 50);

                return () => clearTimeout(timer);
            }
        }
    }, [mode, division, news, prayerTimes]);

    const handleAnimationEnd = () => {
        setStartAnimation(false); // Reset animation

        // Use current state values directly instead of updater function
        // to avoid double-invocation issues in Strict Mode
        const maxCycles = mode === 'prayer' ? 2 : 1;
        const nextCount = cycleCount + 1;

        if (nextCount >= maxCycles) {
            switchMode();
        } else {
            setCycleCount(nextCount);
            // Restart animation for next cycle
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setStartAnimation(true);
                });
            });
        }
    };

    // Fetch News
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/announcements/active');
                const data = await res.json();
                if (data.success && data.data) {
                    setNews(data.data.message);
                } else {
                    setNews('No news for today');
                }
            } catch (err) {
                setNews('No news for today');
            }
        };
        fetchNews();
    }, []);

    // Dynamic Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const isInsideBD = latitude >= 20.5 && latitude <= 26.7 && longitude >= 88.0 && longitude <= 92.9;
                    if (isInsideBD) {
                        let closestDiv = 'Dhaka';
                        let minDistance = Infinity;
                        Object.entries(DIVISIONS).forEach(([name, coords]) => {
                            const dist = Math.sqrt(Math.pow(latitude - coords.lat, 2) + Math.pow(longitude - coords.lng, 2));
                            if (dist < minDistance) {
                                minDistance = dist;
                                closestDiv = name;
                            }
                        });
                        setDivision(closestDiv);
                    }
                },
                () => setDivision('Dhaka')
            );
        }
    }, []);

    // Calculate Prayer Times
    useEffect(() => {
        const coords = DIVISIONS[division as keyof typeof DIVISIONS];
        const date = new Date();
        const params = CalculationMethod.Karachi();
        const coordinates = new Coordinates(coords.lat, coords.lng);
        const prayerTimes = new PrayerTimes(coordinates, date, params);

        setPrayerTimes({
            Fajr: prayerTimes.fajr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            Dhuhr: prayerTimes.dhuhr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            Asr: prayerTimes.asr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            Maghrib: prayerTimes.maghrib.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            Isha: prayerTimes.isha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        });

        const current = prayerTimes.currentPrayer();
        const next = prayerTimes.nextPrayer();
        setNextPrayer(current === 'none' ? 'Fajr' : next === 'none' ? 'Fajr' : next);
    }, [division]);

    return (
        <div ref={containerRef} className="bg-black text-white h-14 flex items-center px-0 text-sm overflow-hidden relative z-10 w-full">

            {/* Time Mode - Static Centered */}
            {mode === 'time' && (
                <div key="time" className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono font-bold text-lg text-green-400 tracking-widest">
                        {time} <span className="text-xs text-gray-400 ml-1">BD Time</span>
                    </span>
                </div>
            )}

            {/* Prayer Mode - Scrolling */}
            {mode === 'prayer' && (
                <div
                    key="prayer"
                    ref={contentRef}
                    className="absolute flex items-center whitespace-nowrap"
                    style={{
                        left: '100%',
                        willChange: 'transform',
                        animation: startAnimation ? `marquee ${duration}s linear forwards` : 'none'
                    }}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <span className="text-yellow-400 font-bold mr-4 text-base">Prayer Times ({division}):</span>
                    <div className="flex gap-6">
                        {prayerTimes && Object.entries(prayerTimes).map(([name, time]) => (
                            <div key={name} className={`flex flex-col items-center justify-center ${name.toLowerCase() === nextPrayer ? 'text-red-500 font-bold scale-110' : 'text-gray-300'}`}>
                                <span className="text-xs uppercase tracking-wider">{name}</span>
                                <span className="text-lg font-mono leading-none">{time as string}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* News Mode - Scrolling */}
            {mode === 'news' && (
                <div
                    key="news"
                    ref={contentRef}
                    className="absolute flex items-center whitespace-nowrap"
                    style={{
                        left: '100%',
                        willChange: 'transform',
                        animation: startAnimation ? `marquee ${duration}s linear forwards` : 'none'
                    }}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <span className="text-blue-400 font-bold mr-4 text-base">NEWS:</span>
                    <span className="text-white text-lg">{news}</span>
                </div>
            )}

            <style jsx>{`
                @keyframes marquee {
                    to { transform: translateX(calc(-100% - 100vw)); }
                }
            `}</style>
        </div>
    );
};
