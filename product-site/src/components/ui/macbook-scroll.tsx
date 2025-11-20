"use client";
import React, { useEffect, useRef, useState } from "react";
import { MotionValue, motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Terminal, Zap, Folder, Settings } from "lucide-react";

export const MacbookScroll = ({
  src,
  showGradient,
  title,
  badge,
}: {
  src?: string;
  showGradient?: boolean;
  title?: string | React.ReactNode;
  badge?: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [1.2, isMobile ? 1 : 1.5]
  );
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1500]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div
      ref={ref}
      className="min-h-[200vh] flex flex-col items-center py-0 md:py-80 justify-start flex-shrink-0 [perspective:800px] transform md:scale-100 scale-[0.35] sm:scale-50"
    >
      <motion.h2
        style={{
          translateY: textTransform,
          opacity: textOpacity,
        }}
        className="dark:text-white text-neutral-800 text-3xl font-bold mb-20 text-center"
      >
        {title || (
          <span>
            Built for <br /> <span className="text-primary text-6xl">Speed</span>
          </span>
        )}
      </motion.h2>
      {/* Lid */}
      <Lid
        src={src}
        scaleX={scaleX}
        scaleY={scaleY}
        rotate={rotate}
        translate={translate}
      />
      {/* Base area */}
      <div className="h-[22rem] w-[32rem] bg-gray-200 dark:bg-[#272729] rounded-2xl overflow-hidden relative -z-10">
        {/* above keyboard bar */}
        <div className="h-10 w-full relative">
          <div className="absolute inset-x-0 mx-auto w-[80%] h-4 bg-[#050505]" />
        </div>
        <div className="flex relative">
          <div className="mx-auto w-[10%] overflow-hidden  h-full">
            <SpeakerGrid />
          </div>
          <div className="mx-auto w-[80%] h-full">
            <Keypad />
          </div>
          <div className="mx-auto w-[10%] overflow-hidden  h-full">
            <SpeakerGrid />
          </div>
        </div>
        <div className="w-full h-2 bg-[#272729] absolute bottom-0 z-50" />
        <div className="h-2 w-full bg-gradient-to-t from-white/20 to-transparent absolute bottom-0 z-50" />
      </div>
      <Trackpad />
      <div className="h-2 w-[32rem] bg-gray-200 dark:bg-[#272729] bottom-0 z-50" />
    </div>
  );
};

export const Lid = ({
  scaleX,
  scaleY,
  rotate,
  translate,
  src,
}: {
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
  src?: string;
}) => {
  return (
    <div className="relative [perspective:800px]">
      <div
        style={{
          transform: "perspective(800px) rotateX(-25deg) translateZ(0px)",
          transformOrigin: "bottom",
          transformStyle: "preserve-3d",
        }}
        className="h-[12rem] w-[32rem] bg-[#010101] rounded-2xl p-2 relative"
      >
        <div
          style={{
            boxShadow: "0px 2px 0px 2px var(--neutral-900) inset",
          }}
          className="absolute inset-0 bg-[#010101] rounded-2xl flex items-center justify-center"
        >
          <span className="text-white">
            <Terminal className="w-10 h-10 text-neutral-700" />
          </span>
        </div>
      </div>
      <motion.div
        style={{
          scaleX: scaleX,
          scaleY: scaleY,
          rotateX: rotate,
          translateY: translate,
          transformStyle: "preserve-3d",
          transformOrigin: "top",
        }}
        className="h-[22rem] w-[32rem] absolute inset-0 bg-[#010101] rounded-2xl p-2"
      >
        <div className="absolute inset-0 bg-[#272729] rounded-2xl" />

        <div className="absolute inset-0 bg-black rounded-2xl overflow-hidden flex flex-col">
            {/* Mock UI inside the screen */}
            <div className="h-8 bg-neutral-900 flex items-center px-4 gap-2 border-b border-neutral-800">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-xs text-neutral-500 font-mono">Anayas v2.0</div>
            </div>
            <div className="flex-1 flex">
                <div className="w-16 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-4 gap-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <Folder className="w-5 h-5 text-neutral-500" />
                    <Settings className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="w-64 bg-neutral-900/50 border-r border-neutral-800 p-4">
                    <div className="h-4 w-24 bg-neutral-800 rounded mb-4" />
                    <div className="space-y-2">
                        <div className="h-8 w-full bg-neutral-800/50 rounded" />
                        <div className="h-8 w-full bg-neutral-800/50 rounded" />
                        <div className="h-8 w-full bg-neutral-800/50 rounded" />
                    </div>
                </div>
                <div className="flex-1 bg-black p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-white font-bold mb-2">Ready to Request</h3>
                        <p className="text-neutral-500 text-sm">Send your first API request</p>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Trackpad = () => {
  return (
    <div
      className="w-[40%] mx-auto h-32  rounded-xl my-1"
      style={{
        boxShadow: "0px 0px 1px 1px #00000020 inset",
      }}
    ></div>
  );
};

export const Keypad = () => {
  return (
    <div className="h-full rounded-md bg-[#050505] mx-1 p-1">
      {/* First Row */}
      <div className="flex justify-between w-full gap-1 mb-1">
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
        <div className="group w-full h-2 rounded-[2px] bg-neutral-900" />
      </div>
      {/* Second Row */}
      <div className="flex justify-between w-full gap-1 mb-1">
        <div className="group w-[1.5fr] h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-[1.5fr] h-8 rounded-[4px] bg-neutral-900" />
      </div>
      {/* Third Row */}
      <div className="flex justify-between w-full gap-1 mb-1">
        <div className="group w-[1.8fr] h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-full h-8 rounded-[4px] bg-neutral-900" />
        <div className="group w-[2.2fr] h-8 rounded-[4px] bg-neutral-900" />
      </div>
    </div>
  );
};

export const SpeakerGrid = () => {
  return (
    <div
      className="flex px-0.5 gap-0.5 mt-2 h-40"
      style={{
        backgroundImage:
          "radial-gradient(circle, #080808 0.5px, transparent 0.5px)",
        backgroundSize: "3px 3px",
      }}
    ></div>
  );
};
