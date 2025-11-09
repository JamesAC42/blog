"use client";

import styles from "./gallerypreview.module.scss";

import Image from "next/image";
import { Window } from "../Window/Window";
import { Button } from "../Button/Button";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import previous from "../../assets/images/icons/previous.png";
import next from "../../assets/images/icons/next.png";

export interface IGalleryPreviewProps {
    images: {
        src: string;
        alt: string;
        caption: string;
    }[];
}

// Use incoming images for carousel length

export const GalleryPreview = (props: IGalleryPreviewProps) => {

    const paneContainerRef = useRef<HTMLDivElement | null>(null);
    const paneRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const isDraggingRef = useRef<boolean>(false);
    const initialXRef = useRef<number | null>(null);
    const startOffsetRef = useRef<number>(0);
    const currentOffsetRef = useRef<number>(0);

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const activeIndexRef = useRef<number>(0);
    const forcedActiveIndexRef = useRef<number | null>(null);

    const transitionRafRef = useRef<number | null>(null);

    // Initialize refs array to match number of images
    if (itemRefs.current.length !== props.images.length) {
        itemRefs.current = Array(props.images.length).fill(null);
    }

    const setItemRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
        itemRefs.current[index] = el;
    }, []);

    const applyParentTransform = (absoluteOffsetPx: number) => {
        const parent = paneRef.current;
        if (!parent) return;
        // convert to rem for project rule compliance
        const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const offsetRem = absoluteOffsetPx / rootFontSizePx;
        parent.style.transform = `translate(calc(-50% + ${offsetRem}rem), -50%)`;
    }

    const updateItemTransforms = useCallback(() => {
        const paneContainer = paneContainerRef.current;
        if (!paneContainer) return;
        
        const paneContainerRect = paneContainer.getBoundingClientRect();
        const paneContainerCenterX = paneContainerRect.left + paneContainerRect.width / 2;

        // Update each panel with its offset from center
        itemRefs.current.forEach((itemRef, i) => {
            if (itemRef) {
                const itemRect = itemRef.getBoundingClientRect();
                const itemCenterX = itemRect.left + itemRect.width / 2;
                const offsetFromCenter = itemCenterX - paneContainerCenterX;

                const bufferZone = 50; // Dead zone where no transform is applied
                const transitionZone = 170; // Zone where transform transitions from 0 to max

                const applyCenter = () => {
                    itemRef.style.transform = `perspective(100px) translateZ(10px) rotateY(0deg)`;
                    itemRef.style.opacity = "1";
                    itemRef.style.filter = "brightness(1)";
                };
                const applyFar = (sign: number) => {
                    const rotationY = sign > 0 ? 10 : -10;
                    itemRef.style.transform = `perspective(100px) translateZ(-100px) rotateY(${rotationY}deg)`;
                    itemRef.style.opacity = "0.5";
                    itemRef.style.filter = "brightness(0.8)";
                };
                const applyTransition = (normalizedTransition: number, sign: number) => {
                    const rotationY = sign * normalizedTransition * 10;
                    const translateZ = 10 - (normalizedTransition * 110);
                    const opacity = 1 - (normalizedTransition * 0.5);
                    const brightness = 1 - (normalizedTransition * 0.2);
                    itemRef.style.transform = `perspective(100px) translateZ(${translateZ}px) rotateY(${rotationY}deg)`;
                    itemRef.style.opacity = opacity.toString();
                    itemRef.style.filter = `brightness(${brightness})`;
                };

                const sign = offsetFromCenter >= 0 ? 1 : -1;
                const absOffset = Math.abs(offsetFromCenter);

                // Forced active overrides geometry for the duration of a snap/center animation
                if (forcedActiveIndexRef.current !== null) {
                    if (i === forcedActiveIndexRef.current) {
                        applyCenter();
                    } else if (absOffset <= bufferZone) {
                        // push non-active items slightly out of center while forced
                        applyTransition(0.2, sign);
                    } else if (absOffset > bufferZone + transitionZone) {
                        applyFar(sign);
                    } else {
                        const distanceFromBuffer = absOffset - bufferZone;
                        const normalizedTransition = distanceFromBuffer / transitionZone;
                        applyTransition(normalizedTransition, sign);
                    }
                    return;
                }

                // Normal geometry-based styling
                if (absOffset <= bufferZone) {
                    applyCenter();
                } else if (absOffset > bufferZone + transitionZone) {
                    applyFar(sign);
                } else {
                    const distanceFromBuffer = absOffset - bufferZone;
                    const normalizedTransition = distanceFromBuffer / transitionZone; // 0 to 1
                    applyTransition(normalizedTransition, sign);
                }
            }
        });
    }, []);

    const updateTransforms = useCallback((absoluteOffsetPx: number) => {
        applyParentTransform(absoluteOffsetPx);
        updateItemTransforms();
    }, [updateItemTransforms]);

    const getPaneCenterX = () => {
        const paneContainer = paneContainerRef.current;
        if (!paneContainer) return 0;
        const rect = paneContainer.getBoundingClientRect();
        return rect.left + rect.width / 2;
    }

    const getClosestIndexAndOffset = useCallback(() => {
        const centerX = getPaneCenterX();
        let closestDistance = Infinity;
        let closestOffsetFromCenter = 0;
        let closestIndex = 0;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const itemRef = itemRefs.current[i];
            if (!itemRef) continue;
            const itemRect = itemRef.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const offsetFromCenter = itemCenterX - centerX;
            const distance = Math.abs(offsetFromCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestOffsetFromCenter = offsetFromCenter;
                closestIndex = i;
            }
        }
        return { closestIndex, closestOffsetFromCenter };
    }, []);

    const setActive = (index: number) => {
        activeIndexRef.current = index;
        setActiveIndex(index);
    }

    const stopTransitionRaf = () => {
        if (transitionRafRef.current !== null) {
            cancelAnimationFrame(transitionRafRef.current);
            transitionRafRef.current = null;
        }
    }

    const startTransitionRaf = useCallback(() => {
        stopTransitionRaf();
        const tick = () => {
            updateItemTransforms();
            transitionRafRef.current = requestAnimationFrame(tick);
        };
        transitionRafRef.current = requestAnimationFrame(tick);
    }, [updateItemTransforms]);

    const centerItemAt = useCallback((index: number, animate: boolean = true) => {
        const total = itemRefs.current.length;
        if (total === 0) return;
        const clamped = Math.max(0, Math.min(total - 1, index));

        const { closestOffsetFromCenter } = (() => {
            const centerX = getPaneCenterX();
            const itemRef = itemRefs.current[clamped];
            if (!itemRef) return { closestOffsetFromCenter: 0 };
            const rect = itemRef.getBoundingClientRect();
            const itemCenterX = rect.left + rect.width / 2;
            return { closestOffsetFromCenter: itemCenterX - centerX };
        })();

        const newOffset = currentOffsetRef.current - closestOffsetFromCenter;
        currentOffsetRef.current = newOffset;

        const parent = paneRef.current;
        if (parent) {
            if (animate) {
                forcedActiveIndexRef.current = clamped;
                const onEnd = () => {
                    parent.removeEventListener("transitionend", onEnd as EventListener);
                    parent.style.transition = '';
                    stopTransitionRaf();
                    forcedActiveIndexRef.current = null;
                    updateItemTransforms();
                };
                parent.addEventListener("transitionend", onEnd as EventListener, { once: true } as AddEventListenerOptions);
                parent.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                applyParentTransform(newOffset);
                startTransitionRaf();
            } else {
                forcedActiveIndexRef.current = null;
                applyParentTransform(newOffset);
                updateItemTransforms();
            }
        } else {
            forcedActiveIndexRef.current = null;
            updateItemTransforms();
        }

        setActive(clamped);
    }, [updateItemTransforms, startTransitionRaf]);

    const snapToClosestItem = useCallback(() => {
        const total = itemRefs.current.length;
        if (total === 0) return;
        const { closestIndex } = getClosestIndexAndOffset();
        centerItemAt(closestIndex, true);
    }, [centerItemAt, getClosestIndexAndOffset]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || initialXRef.current == null) return;
        const containerLeft = paneContainerRef.current?.getBoundingClientRect().left ?? 0;
        const currentX = e.clientX - containerLeft;
        const dx = currentX - initialXRef.current;
        const newOffset = startOffsetRef.current + dx;
        currentOffsetRef.current = newOffset;
        updateTransforms(newOffset);
    }, [updateTransforms]);

    const handleMouseUp = useCallback(() => {
        window.removeEventListener("mousemove", handleMouseMove as unknown as EventListener);
        window.removeEventListener("mouseup", handleMouseUp as unknown as EventListener);
        isDraggingRef.current = false;
        initialXRef.current = null;
        
        // Snap to closest item when dragging ends
        snapToClosestItem();
    }, [handleMouseMove, snapToClosestItem]);

    const initDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        const containerLeft = paneContainerRef.current?.getBoundingClientRect().left ?? 0;
        const startX = e.clientX - containerLeft;
        initialXRef.current = startX;
        startOffsetRef.current = currentOffsetRef.current;
        isDraggingRef.current = true;
        forcedActiveIndexRef.current = null; // during free-drag, use pure geometry
        stopTransitionRaf();
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove as unknown as EventListener);
        window.addEventListener("mouseup", handleMouseUp as unknown as EventListener);
    }

    // Ensure correct initial transforms after DOM layout
    useLayoutEffect(() => {
        const raf = requestAnimationFrame(() => {
            // center first item on load
            centerItemAt(0, false);
        });
        return () => cancelAnimationFrame(raf);
    }, [centerItemAt]);

    // Keep transforms in sync on resize (keep the same active index centered)
    useEffect(() => {
        const onResize = () => centerItemAt(activeIndexRef.current, false);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [centerItemAt]);

    const goToPrev = useCallback(() => {
        const total = itemRefs.current.length;
        if (total === 0) return;
        const nextIndex = Math.max(0, activeIndexRef.current - 1);
        if (nextIndex === activeIndexRef.current) return; // at left bound
        centerItemAt(nextIndex, true);
    }, [centerItemAt]);

    const goToNext = useCallback(() => {
        const total = itemRefs.current.length;
        if (total === 0) return;
        const nextIndex = Math.min(total - 1, activeIndexRef.current + 1);
        if (nextIndex === activeIndexRef.current) return; // at right bound
        centerItemAt(nextIndex, true);
    }, [centerItemAt]);

    const atLeftEdge = activeIndex === 0;
    const atRightEdge = activeIndex === Math.max(0, itemRefs.current.length - 1);

    return (
        <>
            <div className={styles.galleryPreview}>
                {
                    props.images.length === 0 && (
                        <div className={styles.galleryPreviewItem}>
                            <Window>
                                <span>No images</span>
                            </Window>
                        </div>
                    )
                }

            </div>
            <div 
                className={styles.scrollablePane}
                onMouseDown={initDrag}
                ref={paneContainerRef}>
                <div className={styles.scrollablePaneInner} ref={paneRef}>
                    {props.images.map((img, index) => (
                        <div
                            className={styles.galleryPreviewItem}
                            key={`${img.src}-${index}`}
                            ref={setItemRef(index)}>
                            <Window>
                                <div className={styles.galleryItemInner}>
                                    <Image src={img.src} alt={img.alt} width={400} height={300} />
                                    <p>{img.caption}</p>
                                </div>
                            </Window>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.actions}>
                <Button disabled={atLeftEdge} onClick={goToPrev}>
                    <Image src={previous} alt="previous" />
                </Button>
                <Button text="view more" onClick={() => { window.location.href = "/gallery"; }} />
                <Button disabled={atRightEdge} onClick={goToNext}>
                    <Image src={next} alt="next" />
                </Button>
            </div>
        </>
    )
}