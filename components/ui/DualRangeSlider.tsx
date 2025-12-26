import React, { useRef, useEffect, useState } from 'react';

interface DualRangeSliderProps {
    min: number;
    max: number;
    values: [number, number];
    onChange: (values: [number, number]) => void;
    darkMode: boolean;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, values, onChange, darkMode }) => {
    const [minVal, setMinVal] = useState(values[0]);
    const [maxVal, setMaxVal] = useState(values[1]);
    const minValRef = useRef(values[0]);
    const maxValRef = useRef(values[1]);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage, clamped to 0-100 to prevent overflow
    const getPercent = (value: number) => {
        const percent = ((value - min) / (max - min)) * 100;
        return Math.min(100, Math.max(0, Math.round(percent)));
    };

    useEffect(() => {
        setMinVal(values[0]);
        setMaxVal(values[1]);
        minValRef.current = values[0];
        maxValRef.current = values[1];
    }, [values]);

    // Set width of the range to decrease from the left side
    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${Math.max(0, maxPercent - minPercent)}%`;
        }
    }, [minVal, maxVal]);

    // Set width of the range to decrease from the right side
    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.width = `${Math.max(0, maxPercent - minPercent)}%`;
        }
    }, [maxVal]);


    // CSS for the slider inputs
    const thumbnailStyle = `
        input[type="range"]::-webkit-slider-thumb {
            pointer-events: all;
            width: 24px;
            height: 24px;
            -webkit-appearance: none;
            cursor: pointer;
            background: ${darkMode ? '#22d3ee' : '#2563eb'};
            border-radius: 50%;
            box-shadow: 0 0 10px ${darkMode ? 'rgba(34, 211, 238, 0.5)' : 'rgba(37, 99, 235, 0.5)'};
            border: 2px solid #fff;
            margin-top: -10px; /* Needed for Chrome */
        }
        input[type="range"]::-moz-range-thumb {
            pointer-events: all;
            width: 24px;
            height: 24px;
            cursor: pointer;
            background: ${darkMode ? '#22d3ee' : '#2563eb'};
            border-radius: 50%;
            box-shadow: 0 0 10px ${darkMode ? 'rgba(34, 211, 238, 0.5)' : 'rgba(37, 99, 235, 0.5)'};
            border: 2px solid #fff;
        }
    `;

    return (
        <div className="relative w-full h-12 flex items-center justify-center">
            <style>{thumbnailStyle}</style>
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                onChange={(event) => {
                    const value = Math.max(Number(event.target.value), min);
                    const newVal = Math.min(value, maxVal - 1);
                    setMinVal(newVal);
                    minValRef.current = newVal;
                    onChange([newVal, maxVal]);
                }}
                className="absolute pointer-events-none appearance-none z-20 h-0 w-full outline-none opacity-0 thumb-pointer-events-auto"
                style={{ zIndex: 3 }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                onChange={(event) => {
                    const value = Math.min(Number(event.target.value), max);
                    const newVal = Math.max(value, minVal + 1);
                    setMaxVal(newVal);
                    maxValRef.current = newVal;
                    onChange([minVal, newVal]);
                }}
                className="absolute pointer-events-none appearance-none z-20 h-0 w-full outline-none opacity-0 thumb-pointer-events-auto"
                style={{ zIndex: 4 }}
            />

            <div className="relative w-full">
                {/* Track Background */}
                <div className={`absolute w-full h-2 rounded z-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                {/* Active Range */}
                <div
                    ref={range}
                    className={`absolute h-2 rounded z-10 ${darkMode ? 'bg-cyan-400' : 'bg-blue-600'}`}
                ></div>

                {/* Visible Thumbs Hack (since inputs are invisible-ish) - actually inputs are opacity 0 but thumbs are styled? 
                    Wait, if I set input opacity to 0, thumbs might disappear in some browsers.
                    Better approach: Inputs have transparent background but visible thumbs.
                 */}
                {/* Re-implementing input styles inline to ensure visibility */}
            </div>

            {/* We need visible inputs for the thumbs to work reliably with the above CSS injection approach.
                 Let's fix the input styling. 
             */}
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                onChange={(e) => {
                    const val = Math.min(Number(e.target.value), maxVal - 1);
                    setMinVal(val);
                    onChange([val, maxVal]);
                }}
                className={`thumb-input absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-100 bg-transparent`}
                style={{ zIndex: 5, background: 'transparent' }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                onChange={(e) => {
                    const val = Math.max(Number(e.target.value), minVal + 1);
                    setMaxVal(val);
                    onChange([minVal, val]);
                }}
                className={`thumb-input absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-100 bg-transparent`}
                style={{ zIndex: 6, background: 'transparent' }}
            />
        </div>
    );
};
