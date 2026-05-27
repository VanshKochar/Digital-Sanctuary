"use client";

import React from "react";

interface MascotProps {
  type: 1 | 2 | 3 | 4;
  className?: string;
}

export default function Mascot({ type, className = "" }: MascotProps) {
  // type 1: Jumping girl in overalls (Saarthi AI)
  // type 2: Man in suit
  // type 3: Coat girl holding bags (Inner Atlas)
  // type 4: Prayer girl (Arjuna Mode)
  
  const leftShift = {
    1: "0%",
    2: "-100%",
    3: "-200%",
    4: "-300%",
  };

  return (
    <div className={`relative overflow-hidden aspect-[3/4] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Image_3.png"
        alt={`Re.Mind Mascot ${type}`}
        className="absolute top-0 h-full max-w-none pointer-events-none select-none"
        style={{
          left: leftShift[type],
          width: "400%",
        }}
      />
    </div>
  );
}
