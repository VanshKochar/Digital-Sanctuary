"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  width: number;
  height: number;
  left: number;
  delay: number;
  duration: number;
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      width: Math.random() * 15 + 5,
      height: Math.random() * 15 + 5,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 15 + 15,
    }));

    // Defer state update to next animation frame to avoid cascading render warnings
    const animId = requestAnimationFrame(() => {
      setParticles(generated);
    });

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle bg-sacred-blush/20 rounded-full"
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
