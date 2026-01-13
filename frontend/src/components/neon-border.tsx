"use client";

import { useEffect, useRef } from "react";

export function NeonBorder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    let hue = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const borderWidth = 4;
      const glowSize = 14;

      // Update hue for rainbow effect
      hue = (hue + 1) % 360;

      // Create gradient for the border
      const createGradient = (
        x1: number,
        y1: number,
        x2: number,
        y2: number
      ) => {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        // RGB cycling colors - gaming laptop style
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`);
        gradient.addColorStop(
          0.25,
          `hsla(${(hue + 90) % 360}, 100%, 50%, 0.8)`
        );
        gradient.addColorStop(
          0.5,
          `hsla(${(hue + 180) % 360}, 100%, 50%, 0.8)`
        );
        gradient.addColorStop(
          0.75,
          `hsla(${(hue + 270) % 360}, 100%, 50%, 0.8)`
        );
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.8)`);

        return gradient;
      };

      // Draw with glow effect
      ctx.shadowBlur = glowSize;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      // Top border
      ctx.strokeStyle = createGradient(0, 0, canvas.width, 0);
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.moveTo(0, borderWidth / 2);
      ctx.lineTo(canvas.width, borderWidth / 2);
      ctx.stroke();

      // Right border
      ctx.strokeStyle = createGradient(
        canvas.width,
        0,
        canvas.width,
        canvas.height
      );
      ctx.beginPath();
      ctx.moveTo(canvas.width - borderWidth / 2, 0);
      ctx.lineTo(canvas.width - borderWidth / 2, canvas.height);
      ctx.stroke();

      // Bottom border
      ctx.strokeStyle = createGradient(
        canvas.width,
        canvas.height,
        0,
        canvas.height
      );
      ctx.beginPath();
      ctx.moveTo(canvas.width, canvas.height - borderWidth / 2);
      ctx.lineTo(0, canvas.height - borderWidth / 2);
      ctx.stroke();

      // Left border
      ctx.strokeStyle = createGradient(0, canvas.height, 0, 0);
      ctx.beginPath();
      ctx.moveTo(borderWidth / 2, canvas.height);
      ctx.lineTo(borderWidth / 2, 0);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
