"use client";

import { useEffect, useRef } from "react";

// Patriotic palette: red, white, blue, gold.
const COLORS = ["#FF3B30", "#FFFFFF", "#2E6BFF", "#FFD447"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
}

/**
 * Looping canvas fireworks, biased to the top of the screen so page content
 * stays readable. Render it conditionally (it sits behind the boosted content).
 * Respects prefers-reduced-motion.
 */
export function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rockets: Rocket[] = [];
    const parts: Particle[] = [];
    let last = 0;
    let raf = 0;
    let alive = true;

    const launch = () => {
      rockets.push({
        x: w * (0.14 + Math.random() * 0.72),
        y: h + 8,
        vy: -(6.8 + Math.random() * 2.4),
        targetY: h * (0.08 + Math.random() * 0.34),
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    };
    const burst = (x: number, y: number, color: string) => {
      const n = 44 + ((Math.random() * 26) | 0);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.15;
        const s = 1.25 + Math.random() * 2.7;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0,
          maxLife: 66 + Math.random() * 48,
          color,
          size: 1.4 + Math.random() * 1.4,
        });
      }
    };

    const frame = (ts: number) => {
      if (!alive) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      if (ts - last > 680 && rockets.length < 4) {
        launch();
        last = ts;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy += 0.04;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + 7);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
        if (r.y <= r.targetY || r.vy >= 0) {
          burst(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.028;
        p.vx *= 0.985;
        p.vy *= 0.985;
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (p.life >= p.maxLife) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    launch();
    launch();
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[45]" />;
}
