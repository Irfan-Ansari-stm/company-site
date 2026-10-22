'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let isDark = document.documentElement.classList.contains('dark');

    const handleThemeChange = () => {
      isDark = document.documentElement.classList.contains('dark');
    };

    window.addEventListener('themechange', handleThemeChange);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false,
    };

    const darkColors = [
      'rgba(139, 92, 246, ', // Primary purple (#8B5CF6)
      'rgba(99, 102, 241, ', // Indigo (#6366F1)
      'rgba(6, 182, 212, ',  // Cyan (#06B6D4)
      'rgba(236, 72, 153, ', // Pink accent (#EC4899)
    ];

    const lightColors = [
      'rgba(124, 58, 237, ', // Deep Violet (#7C3AED)
      'rgba(79, 70, 229, ',  // Indigo (#4F46E5)
      'rgba(14, 165, 233, ', // Sky Blue (#0EA5E9)
      'rgba(219, 39, 119, ', // Deep Pink (#DB2777)
    ];

    const particleCount = Math.min(Math.floor((width * height) / 14000), 85);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 2 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: baseRadius,
        baseRadius,
        color: '',
        alpha: Math.random() * 0.4 + 0.35,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const palette = isDark ? darkColors : lightColors;

      // Draw subtle background radial ambient glow following mouse
      if (mouse.active) {
        const glowGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 2
        );
        if (isDark) {
          glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
          glowGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.04)');
          glowGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
          glowGradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.03)');
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Mouse interaction: gentle repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 1.5;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
            p.radius = p.baseRadius * (1 + (1 - dist / mouse.radius) * 1.4);
          } else {
            p.radius += (p.baseRadius - p.radius) * 0.05;
          }
        }

        const colorBase = palette[i % palette.length];

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${colorBase}${p.alpha})`;
        if (isDark) {
          ctx.shadowColor = `${colorBase}0.8)`;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowColor = `${colorBase}0.3)`;
          ctx.shadowBlur = 4;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles with luminous lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * (isDark ? 0.22 : 0.16);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(148, 163, 184, ${lineAlpha})`
              : `rgba(100, 116, 139, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
}
