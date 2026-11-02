'use client';

import React, { useEffect, useRef, useState, useId } from 'react';

// In-memory registry of revealed element IDs during the active browser session.
// Persists across Next.js client-side navigations (e.g., navigating to /login and returning),
// but automatically resets on browser refresh (F5/reload) or when a new tab/session is opened.
const revealedElements = new Set<string>();

export interface ScrollRevealProps {
  children: React.ReactNode;
  id?: string;          // Stable ID for session persistence across client-side routes
  className?: string;
  delay?: number;       // Delay in seconds (e.g., 0.1, 0.25)
  duration?: number;    // Duration in seconds (default 0.75)
  distance?: number;    // Translation distance in px (default 32)
  threshold?: number;   // Viewport intersection ratio (default 0.15)
  rootMargin?: string;  // Viewport trigger margin (default '-60px')
}

export function ScrollReveal({
  children,
  id,
  className = '',
  delay = 0,
  duration = 0.75,
  distance = 32,
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
}: ScrollRevealProps) {
  const reactId = useId();
  const revealId = id || reactId;

  // Track if this element was already revealed in a previous view during this browser session
  const wasRevealedBeforeMount = useRef(
    typeof window !== 'undefined' && revealedElements.has(revealId)
  );

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || wasRevealedBeforeMount.current) {
        return true;
      }
    }
    return false;
  });

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If already revealed before mount, ensure visible and exit
    if (wasRevealedBeforeMount.current) {
      if (!isVisible) setIsVisible(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      revealedElements.add(revealId);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          revealedElements.add(revealId);
          setIsVisible(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [revealId, threshold, rootMargin, isVisible]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${distance}px, 0)`,
        transition: wasRevealedBeforeMount.current
          ? 'none'
          : `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

export interface StaggerContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  childClassName?: string;
  staggerDelay?: number; // Delay between children (default 0.12s)
  initialDelay?: number; // Starting delay (default 0.2s)
  distance?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
}

export function StaggerContainer({
  children,
  id,
  className = '',
  childClassName = '',
  staggerDelay = 0.12,
  initialDelay = 0.2,
  distance = 32,
  duration = 0.75,
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
}: StaggerContainerProps) {
  const reactId = useId();
  const containerId = id || reactId;

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <ScrollReveal
            id={`${containerId}-${index}`}
            className={childClassName}
            delay={initialDelay + index * staggerDelay}
            distance={distance}
            duration={duration}
            threshold={threshold}
            rootMargin={rootMargin}
          >
            {child}
          </ScrollReveal>
        );
      })}
    </div>
  );
}
