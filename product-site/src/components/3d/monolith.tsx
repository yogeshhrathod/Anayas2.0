"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

export const Monolith = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const t = state.clock.getElapsedTime();
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Rotate based on time and scroll
    meshRef.current.rotation.y = t * 0.1 + progress * Math.PI * 2;
    meshRef.current.rotation.z = t * 0.05 + progress * Math.PI;

    // Move based on scroll
    // meshRef.current.position.y = -progress * 2; // Move down slightly? No, keep centered.
    
    // Distort based on scroll (Warp effect)
    if (materialRef.current) {
      // Phase 1: Solid -> Phase 2: Warp (High distortion) -> Phase 3: Crystal (Calm, Shiny)
      // 0 -> 0.4
      // 0.5 -> 2.0 (Warp)
      // 0.8 -> 0.1 (Crystal)
      
      let distort = 0.4;
      let color = new THREE.Color("#111");
      let roughness = 0.2;
      let metalness = 0.8;

      if (progress < 0.5) {
        distort = 0.4 + (progress / 0.5) * 1.6; // 0.4 -> 2.0
      } else {
        distort = 2.0 - ((progress - 0.5) / 0.5) * 1.9; // 2.0 -> 0.1
      }

      // Crystal Phase (approx 0.7+)
      if (progress > 0.6) {
        // Transition to white/cyan
        const t = Math.min(1, (progress - 0.6) * 3); // Fast transition
        color.lerp(new THREE.Color("#88ccff"), t);
        roughness = THREE.MathUtils.lerp(0.2, 0, t);
        metalness = THREE.MathUtils.lerp(0.8, 1, t);
      }
      
      materialRef.current.distort = distort;
      materialRef.current.color = color;
      materialRef.current.roughness = roughness;
      materialRef.current.metalness = metalness;
    }
  });

  return (
    <Sphere args={[1, 64, 64]} ref={meshRef} scale={1.8}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#111"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
};
