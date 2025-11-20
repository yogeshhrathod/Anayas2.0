"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Monolith } from "./monolith";
import { ScrollManager } from "./scroll-manager";
import { WarpEffect } from "./warp-effect";

export const SceneContent = () => {
  // We'll use the ScrollControls from drei in the parent or handle scroll manually
  // For now, let's just render the Monolith
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <ScrollManager />
      <WarpEffect />
      <Monolith />
    </>
  );
};
