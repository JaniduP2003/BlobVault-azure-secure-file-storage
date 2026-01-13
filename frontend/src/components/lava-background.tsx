"use client";

import { useEffect, useRef } from "react";

export function LavaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resizeCanvas();

    // Lava blob class
    class Blob {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;

      constructor(canvas: HTMLCanvasElement) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 200 + 150; // Bigger blobs!
        this.vx = (Math.random() - 0.5) * 1.2; // Faster movement!
        this.vy = (Math.random() - 0.5) * 1.2;
        
        // More vibrant and visible colors
        const colors = [
          "rgba(59, 130, 246, 0.7)",   // blue-500 - more opaque
          "rgba(6, 182, 212, 0.7)",    // cyan-500 - more opaque
          "rgba(139, 92, 246, 0.6)",   // purple-500
          "rgba(14, 165, 233, 0.7)",   // sky-500 - more opaque
          "rgba(34, 211, 238, 0.6)",   // cyan-400
          "rgba(252, 211, 77, 0.5)",   // amber-300 for contrast
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update(canvas: HTMLCanvasElement) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create blobs
    const blobs: Blob[] = [];
    const blobCount = 10; // More blobs for more visible effect

    for (let i = 0; i < blobCount; i++) {
      blobs.push(new Blob(canvas));
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reduced blur for more visibility
      ctx.filter = "blur(25px)";

      // Update and draw blobs
      blobs.forEach((blob) => {
        blob.update(canvas);
        blob.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
