'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MBTI_DEFINITIONS } from '@/lib/psychometrics/definitions';

export const MbtiCell = ({ mbti }: { mbti: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [supportsHover, setSupportsHover] = useState(true);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const description = MBTI_DEFINITIONS[mbti] || "No description available.";

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipWidth = 288;
            const tooltipHeight = 180;
            const margin = 8;

            const left = Math.max(
                margin,
                Math.min(rect.left, window.innerWidth - tooltipWidth - margin)
            );
            const showAbove = rect.bottom + tooltipHeight + margin > window.innerHeight;
            setPosition({
                top: showAbove ? Math.max(margin, rect.top - tooltipHeight - margin) : rect.bottom + margin,
                left,
            });
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const apply = () => setSupportsHover(hoverQuery.matches);
        apply();
        hoverQuery.addEventListener('change', apply);
        return () => hoverQuery.removeEventListener('change', apply);
    }, []);

    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') return;
        updatePosition();
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                tooltipRef.current?.contains(target)
            ) {
                return;
            }
            setIsOpen(false);
        };
        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const tooltip = isOpen && typeof window !== 'undefined' ? createPortal(
        <div
            ref={tooltipRef}
            className="fixed z-[9999] w-72 max-w-[calc(100vw-16px)] p-4 bg-gray-900 text-white text-xs rounded shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: position.top,
                left: position.left,
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
                onMouseEnter={() => {
                    if (!supportsHover) return;
                    updatePosition();
                    setIsOpen(true);
                }}
                onMouseLeave={() => {
                    if (!supportsHover) return;
                    setIsOpen(false);
                }}
                onClick={() => {
                    if (supportsHover) return;
                    updatePosition();
                    setIsOpen((prev) => !prev);
                }}
            >
                {/* We render children or just the text if passed */}
                <span className="font-mono font-bold text-gray-700">{mbti}</span>
            </div>
            {tooltip}
        </>
    );
};
