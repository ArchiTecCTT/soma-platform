import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  isRightClick: boolean;
}

export default function CustomCursor() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextRippleId = useRef(0);
  const rippleTimeoutIdsRef = useRef<number[]>([]);

  // Core coordinates refs for smooth lerping
  const coordsRef = useRef({
    mouseX: 0,
    mouseY: 0,
    followerX: 0,
    followerY: 0,
  });

  const dotRef = useRef<HTMLDivElement | null>(null);
  const followerRef = useRef<HTMLDivElement | null>(null);
  const activeMagneticRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleQueryChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleQueryChange);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Track mouse coordinates instantly
    const handleMouseMove = (e: MouseEvent) => {
      coordsRef.current.mouseX = e.clientX;
      coordsRef.current.mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      // Magnetic attraction logic
      const activeEl = activeMagneticRef.current;
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        const maxDistance = 90; // Pull radius

        if (distance < maxDistance) {
          const pull = (maxDistance - distance) / maxDistance;
          // Apply magnetic translate to the target element (smooth 22% limit)
          const moveX = distX * pull * 0.22;
          const moveY = distY * pull * 0.22;
          activeEl.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.02)`;
        } else {
          // Release
          activeEl.style.transform = 'translate3d(0, 0, 0)';
          activeMagneticRef.current = null;
        }
      }
    };

    // Event delegation: Dynamically check hovering elements for cursor changes
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Selectors matching interactive items
      const isInteractive = target.closest(
        'a, button, input, textarea, select, [role="button"], .cursor-pointer, .interactive, .magnetic'
      );

      if (isInteractive) {
        document.body.classList.add('cursor-hovering');

        // Check if the interactive item itself or its parent is magnetic
        const magneticEl = target.closest('.magnetic') as HTMLElement;
        if (magneticEl) {
          activeMagneticRef.current = magneticEl;
        }
      } else {
        document.body.classList.remove('cursor-hovering');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = target.closest(
        'a, button, input, textarea, select, [role="button"], .cursor-pointer, .interactive, .magnetic'
      );

      if (isInteractive) {
        const relatedTarget = e.relatedTarget as HTMLElement;
        const leavesInteractive = !relatedTarget || !relatedTarget.closest(
          'a, button, input, textarea, select, [role="button"], .cursor-pointer, .interactive, .magnetic'
        );

        if (leavesInteractive) {
          document.body.classList.remove('cursor-hovering');
          
          if (activeMagneticRef.current) {
            activeMagneticRef.current.style.transform = 'translate3d(0, 0, 0)';
            activeMagneticRef.current = null;
          }
        }
      }
    };

    // Click Visual States & Spawning Ripples
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        return;
      }

      // Spawn Ripple
      const id = nextRippleId.current++;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY, isRightClick: false }]);

      // Left clicks toggle clicking cursor shape
      document.body.classList.add('cursor-clicking');

      // Schedule cleanup for ripples after animation finishes
      const timeoutId = window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 800);
      rippleTimeoutIdsRef.current.push(timeoutId);
    };

    const handlePointerUp = () => {
      document.body.classList.remove('cursor-clicking');
    };

    // Right Click context menu override for customizable pulse visual
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.altKey ||
        target?.closest('input, textarea, select, [contenteditable], [contenteditable=""], [contenteditable="true"]')
      ) {
        return;
      }

      e.preventDefault();
      const id = nextRippleId.current++;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY, isRightClick: true }]);
      const timeoutId = window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 800);
      rippleTimeoutIdsRef.current.push(timeoutId);
    };

    // Initialize follower positions
    coordsRef.current.mouseX = window.innerWidth / 2;
    coordsRef.current.mouseY = window.innerHeight / 2;
    coordsRef.current.followerX = window.innerWidth / 2;
    coordsRef.current.followerY = window.innerHeight / 2;
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${coordsRef.current.mouseX}px, ${coordsRef.current.mouseY}px)`;
    }
    if (followerRef.current) {
      followerRef.current.style.transform = `translate(${coordsRef.current.followerX}px, ${coordsRef.current.followerY}px)`;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('contextmenu', handleContextMenu);

    // Animation Loop for Smooth Follower Lerping
    let animationFrameId: number;
    const updateFollower = () => {
      const coords = coordsRef.current;
      coords.followerX += (coords.mouseX - coords.followerX) * 0.16;
      coords.followerY += (coords.mouseY - coords.followerY) * 0.16;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate(${coords.followerX}px, ${coords.followerY}px)`;
      }

      animationFrameId = requestAnimationFrame(updateFollower);
    };
    updateFollower();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      cancelAnimationFrame(animationFrameId);
      rippleTimeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      rippleTimeoutIdsRef.current = [];
      document.body.classList.remove('cursor-hovering', 'cursor-clicking');
      if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = 'translate3d(0, 0, 0)';
        activeMagneticRef.current = null;
      }
    };
  }, [prefersReducedMotion]);

  // Accessibility Fallback: Disable custom cursor and keep default when reduced motion is preferred
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <>
      {/* Global CSS Injector to override system cursor */}
      <style>{`
        body, body * , body *::before, body *::after {
          cursor: none !important;
        }
        input, textarea, select, [contenteditable], [contenteditable=""], [contenteditable="true"] {
          cursor: text !important;
        }
        button:disabled, [disabled], [aria-disabled='true'] {
          cursor: not-allowed !important;
        }
        
        #cursor-dot, #cursor-follower {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999;
          will-change: transform;
        }
        
        .cursor-dot-inner {
          width: 6px;
          height: 6px;
          background-color: rgba(226, 232, 240, 0.95);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.22s ease;
        }
        
        .cursor-follower-inner {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(226, 232, 240, 0.45);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15), 
                      height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15), 
                      border-color 0.3s ease, 
                      background-color 0.3s ease, 
                      box-shadow 0.3s ease, 
                      transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15);
        }
        
        /* Interactive Hover States */
        body.cursor-hovering .cursor-follower-inner {
          width: 54px;
          height: 54px;
          border-color: #FF5733; /* SOMA brand primary */
          background-color: rgba(255, 87, 51, 0.1);
          box-shadow: 0 0 16px rgba(255, 87, 51, 0.25);
          transform: translate(-50%, -50%) rotate(45deg);
          border-radius: 6px; /* Soft square transition */
        }
        
        body.cursor-hovering .cursor-dot-inner {
          transform: translate(-50%, -50%) scale(0.6);
          background-color: #FF5733;
        }
        
        /* Interactive Click States */
        body.cursor-clicking .cursor-follower-inner {
          transform: translate(-50%, -50%) scale(0.8) rotate(45deg);
          border-color: #00F0FF; /* SOMA brand secondary */
          background-color: rgba(0, 240, 255, 0.05);
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
        }
        
        body.cursor-clicking .cursor-dot-inner {
          transform: translate(-50%, -50%) scale(1.6);
          background-color: #00F0FF;
        }

        /* Ripple Animations */
        .cursor-ripple {
          position: fixed;
          border: 2px solid #FF5733;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: cursor-ripple-anim 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          pointer-events: none;
          z-index: 9998;
        }
        
        @keyframes cursor-ripple-anim {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        
        .cursor-right-click-pulse {
          position: fixed;
          border: 2px dashed #00F0FF;
          border-radius: 4px;
          transform: translate(-50%, -50%) scale(0.5);
          animation: cursor-right-click-pulse-anim 0.75s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          pointer-events: none;
          z-index: 9998;
        }
        
        @keyframes cursor-right-click-pulse-anim {
          0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.2) rotate(45deg); opacity: 0; }
        }

        .magnetic {
          transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
          display: inline-block;
        }
      `}</style>

      {/* Cursor Elements */}
      <div id="cursor-dot" ref={dotRef}>
        <div className="cursor-dot-inner" />
      </div>
      <div id="cursor-follower" ref={followerRef}>
        <div className="cursor-follower-inner" />
      </div>

      {/* Ripple Elements */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className={ripple.isRightClick ? 'cursor-right-click-pulse' : 'cursor-ripple'}
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: ripple.isRightClick ? '80px' : '40px',
            height: ripple.isRightClick ? '80px' : '40px',
          }}
        />
      ))}
    </>
  );
}
