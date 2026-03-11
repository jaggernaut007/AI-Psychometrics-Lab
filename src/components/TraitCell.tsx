'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TraitDefinition {
    title?: string;
    description: string;
    high: string;
    medium?: string;
    low: string;
}

export const TraitCell = ({ title, def, range }: { title: string, def?: TraitDefinition, range: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [supportsHover, setSupportsHover] = useState(true);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipWidth = 288;
            const tooltipHeight = 300;
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

    if (!def) return <span className="text-gray-700">{title}</span>;

    const tooltip = isOpen && typeof window !== 'undefined' ? createPortal(
        <div
            ref={tooltipRef}
            className="fixed z-[9999] w-72 max-w-[calc(100vw-16px)] p-4 bg-gray-900 text-white text-xs rounded shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: position.top,
                left: position.left,
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
                <span>{title}</span>
            </div>
            {tooltip}
        </>
    );
};
