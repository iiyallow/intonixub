import { useEffect, useRef } from "react";
import { useIntonix } from "@/lib/intonix-store";

type Dot = { x: number; y: number; vx: number; vy: number; size: number; color: string };

export function InteractiveBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useIntonix();

  useEffect(() => {
    if (settings.background !== "particles") return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let dots: Dot[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(35, Math.min(105, Math.floor((width * height) / 15000)));
      const palette = ["#7c3aed", "#ec4899", "#22d3ee", "#3b82f6"];
      dots = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: 0.8 + Math.random() * 1.5,
        color: palette[index % palette.length] ?? "#7c3aed",
      }));
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onPointerDown = (event: PointerEvent) => {
      for (const dot of dots) {
        const dx = dot.x - event.clientX;
        const dy = dot.y - event.clientY;
        const distance = Math.max(24, Math.hypot(dx, dy));
        if (distance < 220) {
          dot.vx += (dx / distance) * 2.4;
          dot.vy += (dy / distance) * 2.4;
        }
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      dots.forEach((dot, index) => {
        if (!reducedMotion) {
          if (pointer.active) {
            const dx = pointer.x - dot.x;
            const dy = pointer.y - dot.y;
            const distance = Math.max(40, Math.hypot(dx, dy));
            if (distance < 260) {
              dot.vx += (dx / distance) * 0.012;
              dot.vy += (dy / distance) * 0.012;
            }
          }
          dot.vx *= 0.992;
          dot.vy *= 0.992;
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < -10) dot.x = width + 10;
          if (dot.x > width + 10) dot.x = -10;
          if (dot.y < -10) dot.y = height + 10;
          if (dot.y > height + 10) dot.y = -10;
        }

        context.beginPath();
        context.fillStyle = dot.color;
        context.globalAlpha = 0.58;
        context.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        context.fill();

        for (let next = index + 1; next < dots.length; next += 1) {
          const neighbor = dots[next];
          if (!neighbor) continue;
          const distance = Math.hypot(dot.x - neighbor.x, dot.y - neighbor.y);
          if (distance < 100) {
            context.beginPath();
            context.strokeStyle = dot.color;
            context.globalAlpha = (1 - distance / 100) * 0.12;
            context.moveTo(dot.x, dot.y);
            context.lineTo(neighbor.x, neighbor.y);
            context.stroke();
          }
        }
      });
      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown);
    draw();
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [settings.background]);

  if (settings.background !== "particles") return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}