'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const TraitCell = ({ title, def, range }: { title: string, def?: any, range: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isFlipped, setIsFlipped] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Only run on client to avoid hydration mismatch with portal
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            // Check if close to bottom
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldFlip = spaceBelow < 300; // approximate tooltip height + buffer

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

    if (!def) return <span className="text-gray-700">{title}</span>;

    const tooltip = isHovered && mounted ? createPortal(
        <div
            className="fixed z-[9999] w-72 p-4 bg-gray-900 text-white text-xs rounded shadow-2xl pointer-events-none border border-gray-700 animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: position.top,
                left: position.left,
                transform: `translateY(${isFlipped ? '-100%' : '8px'})`
            }}
        >
            <div className="flex justify-between items-baseline mb-1">
                <div className="font-bold text-sm text-white">{def.title || title}</div>
                <div className="text-[10px] text-gray-400 font-mono">{range}</div>
            </div>
            <div className="mb-3 text-gray-300 leading-relaxed border-b border-gray-700 pb-2">{def.description}</div>
            <div className="grid grid-cols-[35px_1fr] gap-x-3 gap-y-2">
                <span className="text-green-400 font-bold text-right">High:</span> <span className="text-gray-200">{def.high}</span>
                {def.medium && <><span className="text-yellow-400 font-bold text-right">Med:</span> <span className="text-gray-200">{def.medium}</span></>}
                <span className="text-red-400 font-bold text-right">Low:</span> <span className="text-gray-200">{def.low}</span>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div
                ref={triggerRef}
                className="group flex items-center gap-1.5 cursor-help w-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <span>{title}</span>
            </div>
            {tooltip}
        </>
    );
};
