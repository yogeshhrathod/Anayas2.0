"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <main ref={containerRef} className="relative w-full bg-transparent text-white">
      {/* Section 1: Hero */}
      <section className="h-screen flex flex-col items-center justify-center relative z-10 pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-[15vw] font-black tracking-tighter leading-none mix-blend-overlay opacity-50"
        >
          ANAYAS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-xl md:text-2xl font-light tracking-[1em] mt-4 uppercase"
        >
          The Engine of Speed
        </motion.p>
      </section>

      {/* Section 2: Speed */}
      <section className="h-[150vh] flex items-center justify-center relative z-10">
        <div className="text-center">
          <h2 className="text-[10vw] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">
            INSTANT
          </h2>
          <p className="text-2xl md:text-4xl font-light text-neutral-400 mt-4">
            Zero Latency. Pure Performance.
          </p>
        </div>
      </section>

      {/* Section 3: Memory */}
      <section className="h-[150vh] flex items-center justify-center relative z-10">
        <div className="text-center">
          <h2 className="text-[10vw] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">
            LIGHTWEIGHT
          </h2>
          <p className="text-2xl md:text-4xl font-light text-neutral-400 mt-4">
            Under 200MB RAM.
          </p>
        </div>
      </section>

      {/* Section 4: Local */}
      <section className="h-[150vh] flex items-center justify-center relative z-10">
        <div className="text-center">
          <h2 className="text-[10vw] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">
            LOCAL FIRST
          </h2>
          <p className="text-2xl md:text-4xl font-light text-neutral-400 mt-4">
            Your Data. Your Machine.
          </p>
        </div>
      </section>

      {/* Footer / CTA */}
      <section className="h-[50vh] flex flex-col items-center justify-center relative z-10 pb-20">
        <h3 className="text-4xl md:text-6xl font-bold mb-8">Ready to fly?</h3>
        <Button size="lg" className="text-xl px-8 py-6 rounded-full bg-white text-black hover:bg-neutral-200 transition-all pointer-events-auto">
          Get Early Access <ArrowRight className="ml-2 w-6 h-6" />
        </Button>
      </section>
    </main>
  );
}
