'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MBTI_DEFINITIONS } from '@/lib/psychometrics/definitions';

export const MbtiCell = ({ mbti }: { mbti: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isFlipped, setIsFlipped] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Only run on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const description = MBTI_DEFINITIONS[mbti] || "No description available.";

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            // Check if close to bottom
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldFlip = spaceBelow < 150;

            setIsFlipped(shouldFlip);
            setPosition({
                top: shouldFlip ? rect.top : rect.bottom,
                left: rect.left
            });
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const tooltip = isHovered && mounted ? createPortal(
        <div
            className="fixed z-[9999] w-72 p-4 bg-gray-900 text-white text-xs rounded shadow-2xl pointer-events-none border border-gray-700 animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: position.top,
                left: position.left,
                transform: `translateY(${isFlipped ? '-100%' : '8px'})`
            }}
        >
            <div className="font-bold text-sm text-indigo-400 mb-2">{mbti}</div>
            <div className="text-gray-300 leading-relaxed">{description}</div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div
                ref={triggerRef}
                className="group cursor-help w-full h-full flex items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* We render children or just the text if passed */}
                <span className="font-mono font-bold text-gray-700">{mbti}</span>
            </div>
            {tooltip}
        </>
    );
};
