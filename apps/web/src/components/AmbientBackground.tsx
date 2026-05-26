import React, { useEffect, useRef, useState } from 'react';

interface Blob {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  angle: number;
  speed: number;
  driftRange: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  wobbleSpeed: number;
  wobbleRange: number;
  wobbleAngle: number;
  parallaxFactor: number;
}

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Mouse coordinate refs for interpolation (lerping)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  useEffect(() => {
    // Check for reduced motion preference
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    const canvasRectRef = { current: canvas.getBoundingClientRect() };

    // Keep track of blobs and particles
    let blobs: Blob[] = [];
    let particles: Particle[] = [];

    const initializeBlobs = () => {
      blobs = [
        {
          x: width * 0.25,
          y: height * 0.25,
          baseX: width * 0.25,
          baseY: height * 0.25,
          radius: Math.min(width, height) * 0.4,
          color: 'rgba(255, 87, 51, 0.30)', // SOMA orange-red
          angle: 0,
          speed: 0.0012,
          driftRange: 80,
        },
        {
          x: width * 0.75,
          y: height * 0.35,
          baseX: width * 0.75,
          baseY: height * 0.35,
          radius: Math.min(width, height) * 0.45,
          color: 'rgba(0, 240, 255, 0.22)', // SOMA cyan
          angle: Math.PI / 2,
          speed: 0.0008,
          driftRange: 100,
        },
        {
          x: width * 0.4,
          y: height * 0.7,
          baseX: width * 0.4,
          baseY: height * 0.7,
          radius: Math.min(width, height) * 0.5,
          color: 'rgba(138, 100, 255, 0.28)', // Deep Royal Purple
          angle: Math.PI,
          speed: 0.0006,
          driftRange: 120,
        },
        {
          x: width * 0.8,
          y: height * 0.8,
          baseX: width * 0.8,
          baseY: height * 0.8,
          radius: Math.min(width, height) * 0.35,
          color: 'rgba(148, 163, 184, 0.15)', // Soft Slate Glow
          angle: Math.PI * 1.5,
          speed: 0.001,
          driftRange: 60,
        }
      ];
    };


    // Initialize 55 particles
    const initializeParticles = () => {
      particles = Array.from({ length: 55 }, () => {
        const baseAlpha = Math.random() * 0.45 + 0.4;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.1,
          vy: - (Math.random() * 0.25 + 0.15), // Upward drift
          radius: Math.random() * 2.5 + 2.0,
          baseAlpha: baseAlpha,
          wobbleSpeed: Math.random() * 0.015 + 0.005,
          wobbleRange: Math.random() * 0.4 + 0.1,
          wobbleAngle: Math.random() * Math.PI * 2,
          parallaxFactor: Math.random() * 0.25 + 0.1, // Drifting layers
        };

      });
    };


    const renderStaticFrame = () => {
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);

      drawBaseGlow();

      blobs.forEach((blob) => {
        const grad = ctx.createRadialGradient(blob.baseX, blob.baseY, 0, blob.baseX, blob.baseY, blob.radius);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, 'rgba(3, 3, 3, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.baseX, blob.baseY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        ctx.fillStyle = `rgba(226, 232, 240, ${p.baseAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };



    // Warm base glow: always-present orange warmth under blobs
    const drawBaseGlow = () => {
      const cx = width * 0.45;
      const cy = height * 0.45;
      const r = Math.min(width, height) * 0.85;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      glow.addColorStop(0, 'rgba(255, 87, 51, 0.18)');
      glow.addColorStop(0.5, 'rgba(138, 100, 255, 0.09)');
      glow.addColorStop(1, 'rgba(3, 3, 3, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    };

    // Handle high DPI display
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvasRectRef.current = rect;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Reinitialize blobs to match new dimensions
      initializeBlobs();

      if (prefersReducedMotion) {
        renderStaticFrame();
      }
    };


    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRectRef.current;
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };


    const deactivateMouse = () => {
      mouseRef.current.active = false;
    };


    const handleWindowMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        deactivateMouse();
      }
    };


    // Update canvas rect on scroll for parallax accuracy
    const handleScroll = () => {
      canvasRectRef.current = canvas.getBoundingClientRect();
    };


    // Set up canvas sizes and populate arrays
    resizeCanvas();
    initializeParticles();

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleWindowMouseOut);
    window.addEventListener('blur', deactivateMouse);

    // Animation Loop
    const animate = () => {
      if (prefersReducedMotion) {
        renderStaticFrame();
        return;
      }


      ctx.clearRect(0, 0, width, height);
      drawBaseGlow();

      // Lerp mouse positions for ultra-smooth responsiveness
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // 1. UPDATE AND DRAW LIQUID GRADIENT BLOBS
      blobs.forEach((blob) => {
        blob.angle += blob.speed;

        // Path of drift (slow circular/elliptical movement)
        let targetX = blob.baseX + Math.sin(blob.angle) * blob.driftRange;
        let targetY = blob.baseY + Math.cos(blob.angle * 0.8) * blob.driftRange;

        // Mouse attraction: pull gently towards the cursor if active
        if (mouse.active) {
          const dx = mouse.x - blob.baseX;
          const dy = mouse.y - blob.baseY;
          // Blobs pull slightly toward the mouse, capped at 120px max displacement
          const maxInfluence = 120;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pull = Math.min(dist, maxInfluence) / dist;
          
          targetX += dx * pull * 0.35;
          targetY += dy * pull * 0.35;
        }

        // Apply scroll-driven parallax offset to blobs
        targetY -= scrollY * 0.08;

        // Smoothly interpolate the blob position to its targets
        blob.x += (targetX - blob.x) * 0.05;
        blob.y += (targetY - blob.y) * 0.05;

        // Draw Blob
        const radialGradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        );
        radialGradient.addColorStop(0, blob.color);
        radialGradient.addColorStop(1, 'rgba(3, 3, 3, 0)');

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. UPDATE AND DRAW PARTICLES (Drifting atmospheric particles)
      particles.forEach((p) => {
        p.y += p.vy;
        p.wobbleAngle += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobbleAngle) * p.wobbleRange;

        // Apply scroll parallax visually
        let visualY = p.y - scrollY * p.parallaxFactor;

        // Mouse repulsion physics
        if (mouse.active) {
          const visualX = p.x;
          const dx = mouse.x - visualX;
          const dy = mouse.y - visualY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repulsionRadius = 140;

          if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            // Push away from mouse
            p.x -= (dx / (dist || 1)) * force * 1.5;
            p.y -= (dy / (dist || 1)) * force * 1.5;
          }
        }

        // Out of bounds checks
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        
        // Wrap vertical position
        if (p.y < -20) {
          p.y = height + 20 + scrollY * p.parallaxFactor;
          p.x = Math.random() * width;
        }

        // Recompute visual Y in case it wrapped
        visualY = p.y - scrollY * p.parallaxFactor;

        // Smooth fade-in near edges to avoid popping
        let opacity = p.baseAlpha;
        if (visualY < 40) {
          opacity *= visualY / 40;
        } else if (visualY > height - 40) {
          opacity *= (height - visualY) / 40;
        }

        // Ensure opacity remains in safe range [0, 1]
        opacity = Math.max(0, Math.min(1, opacity));

        // Draw Particle
        ctx.fillStyle = `rgba(226, 232, 240, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, visualY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };


    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleWindowMouseOut);
      window.removeEventListener('blur', deactivateMouse);
      cancelAnimationFrame(animationFrameId);
    };

  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#030303]"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
