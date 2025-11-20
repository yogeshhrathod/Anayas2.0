"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

const technologies = [
  { name: "Electron", color: "text-blue-400" },
  { name: "React", color: "text-cyan-400" },
  { name: "TypeScript", color: "text-blue-500" },
  { name: "TailwindCSS", color: "text-teal-400" },
  { name: "Node.js", color: "text-green-500" },
  { name: "Vite", color: "text-purple-400" },
  { name: "Framer Motion", color: "text-pink-500" },
  { name: "Lucide", color: "text-orange-400" },
];

export function TechStack() {
  return (
    <section className="py-20 border-y border-border/50 bg-secondary/5 overflow-hidden">
      <Container>
        {/* Header removed */}
        
        <div className="relative flex overflow-x-hidden group">
          <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
            {/* First set of items */}
            {technologies.map((tech) => (
              <span
                key={tech.name}
                className={`text-2xl md:text-4xl font-bold opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
             {/* Duplicate set for seamless loop */}
             {technologies.map((tech) => (
              <span
                key={`${tech.name}-duplicate`}
                className={`text-2xl md:text-4xl font-bold opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
             {/* Triplicate set for safety on wide screens */}
             {technologies.map((tech) => (
              <span
                key={`${tech.name}-triplicate`}
                className={`text-2xl md:text-4xl font-bold opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>

          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-16 items-center ml-16">
             {/* This is a simplified marquee. For a true infinite loop with CSS, we need the container to slide. 
                 I'll use a simpler approach: just one long flex container with animation defined in globals.css or tailwind config.
                 Wait, I didn't define 'animate-marquee' in tailwind config yet. I should add it.
             */}
          </div>
        </div>
      </Container>
    </section>
  );
}
