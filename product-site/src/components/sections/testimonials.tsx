"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote: "Anayas has completely transformed how we test our APIs. It's blazing fast and the UI is stunning.",
    name: "Sarah Chen",
    title: "Senior Engineer at TechFlow",
  },
  {
    quote: "Finally, an API client that feels native and doesn't eat up all my RAM. A masterpiece.",
    name: "Alex Morgan",
    title: "CTO at DevScale",
  },
  {
    quote: "The environment management is a game changer. Switching between prod and staging is seamless.",
    name: "Marcus Johnson",
    title: "Lead Developer at Streamline",
  },
  {
    quote: "I love the dark mode and the attention to detail. It makes API development a joy.",
    name: "Emily Davis",
    title: "Frontend Architect",
  },
  {
    quote: "Better than Postman, faster than Insomnia. Anayas is the new standard.",
    name: "David Kim",
    title: "Full Stack Developer",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-neutral-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
          Trusted by Developers
        </h2>
        <p className="text-neutral-400 text-lg">
          Join thousands of developers building the future.
        </p>
      </div>

      <div className="flex flex-col antialiased bg-transparent dark:bg-transparent dark:bg-grid-white/[0.05] items-center justify-center relative overflow-hidden">
        <InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
      </div>
    </section>
  );
}

const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useState<HTMLDivElement | null>(null);
  const scrollerRef = useState<HTMLUListElement | null>(null);

  // Simplified infinite scroll implementation with CSS animation
  return (
    <div
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap animate-marquee",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px] bg-gradient-to-b from-neutral-900 to-neutral-950"
            key={item.name}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className=" relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                "{item.quote}"
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.name}
                  </span>
                  <span className=" text-sm leading-[1.6] text-gray-500 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
        {/* Duplicate items for seamless loop */}
        {items.map((item, idx) => (
          <li
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px] bg-gradient-to-b from-neutral-900 to-neutral-950"
            key={`${item.name}-duplicate`}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className=" relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                "{item.quote}"
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.name}
                  </span>
                  <span className=" text-sm leading-[1.6] text-gray-500 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
