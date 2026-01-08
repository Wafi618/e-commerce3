
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
    isActive: boolean;
    color?: string;
    width?: number;
    height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    analyser,
    isActive,
    color = '#60A5FA', // Default blue-400
    width = 300,
    height = 50
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser || !isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Array to store frequency data (0-255)
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);

            // Get current frequency data
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw bars
            // We'll draw 32 bars to keep it looking clean
            const barCount = 32;
            const barWidth = canvas.width / barCount;

            // We step through the dataArray. Since dataArray is typically 256 or 512, 
            // we skip some bins to fit into 32 bars.
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const barHeight = (value / 255) * canvas.height;

                ctx.fillStyle = color;
                // Add a small gap (barWidth - 2)
                ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [analyser, isActive, color]);

    // Render an empty canvas if generic or inactive, but keep layout stable
    return <canvas ref={canvasRef} width={width} height={height} className="rounded-md" />;
};
