"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

export const WarpEffect = () => {
  const starsRef = useRef<any>(null);

  useFrame(() => {
    if (!starsRef.current) return;
    
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Activate warp effect in the middle section (0.3 to 0.6)
    let speed = 0;
    if (progress > 0.2 && progress < 0.7) {
       // Peak at 0.45
       const dist = Math.abs(progress - 0.45);
       speed = Math.max(0, 1 - dist * 4) * 20; // 0 -> 20 -> 0
    }

    // Move stars towards camera to simulate warp
    // Actually, Stars component rotates. Let's just rotate it very fast or use a custom particle system.
    // For simplicity, we'll just rotate it fast.
    starsRef.current.rotation.z += speed * 0.01;
    starsRef.current.rotation.x += speed * 0.005;
    
    // Scale up/down based on speed?
    // starsRef.current.scale.setScalar(1 + speed * 0.1);
  });

  return (
    <group ref={starsRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};
