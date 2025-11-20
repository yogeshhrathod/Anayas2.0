"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { easing } from "maath";

// This component will sync the camera or scene state with scroll
export const ScrollManager = () => {
  const { camera } = useThree();
  
  useFrame((state, delta) => {
    // Get normalized scroll position (0 to 1)
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Example: Move camera based on scroll
    // We can use maath for smooth interpolation
    // easing.damp3(camera.position, [0, 0, 5 + progress * 10], 0.25, delta);
    
    // Or rotate the camera
    // easing.dampE(camera.rotation, [progress * 0.5, 0, 0], 0.25, delta);
  });

  return null;
};
