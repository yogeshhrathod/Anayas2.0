import { motion, useScroll, useTime, useTransform } from 'framer-motion';
import {
  Apple,
  ChevronDown,
  Terminal as Linux,
  Terminal,
  Monitor as Windows,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { ShowcaseLogoAnimation } from './ShowcaseLogoAnimation';
import { Button } from './ui/Button';

const TunnelText = ({
  text,
  delay = 0,
  x = 0,
  y = 0,
}: {
  text: string;
  delay?: number;
  x?: number;
  y?: number;
}) => {
  const time = useTime();

  // Z-axis movement loop
  const z = useTransform(time, t => {
    const period = 8000; // Time for one full cycle
    const offset = (t + delay) % period;
    // Map time to distance: starts far (-2000), comes close (1000)
    return -2000 + (offset / period) * 3000;
  });

  const fade = useTransform(z, [-2000, -500, 500, 1000], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{
        z,
        x,
        y,
        opacity: fade,
        position: 'absolute',
        left: '50%',
        top: '50%',
      }}
      className="text-6xl md:text-[10rem] font-bold text-white/5 whitespace-nowrap font-display pointer-events-none select-none uppercase tracking-tighter"
    >
      <div className="-translate-x-1/2 -translate-y-1/2">{text}</div>
    </motion.div>
  );
};

import { useLatestRelease } from '../hooks/useLatestRelease';

// ... (TunnelText component remains unchanged)

export function Hero() {
  const ref = useRef(null);
  const [platform, setPlatform] = useState<
    'mac' | 'windows' | 'linux' | 'other'
  >('other');
  const [showAllDownloads, setShowAllDownloads] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref });

  const { mac, windows, linux, releaseUrl, version } = useLatestRelease();

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) setPlatform('mac');
    else if (ua.includes('win')) setPlatform('windows');
    else if (ua.includes('linux')) setPlatform('linux');
  }, []);

  const platformInfo = {
    mac: { label: 'macOS (DMG)', icon: Apple, url: mac },
    windows: { label: 'Windows (EXE)', icon: Windows, url: windows },
    linux: { label: 'Linux (AppImage)', icon: Linux, url: linux },
    other: { label: 'Download Luna_', icon: Terminal, url: releaseUrl },
  };

  const currentPlatform = platformInfo[platform];

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-black flex flex-col items-center justify-center perspective-[1000px] pt-24 pb-12 overflow-y-auto"
    >
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Tunnel Effect */}
      <div className="absolute inset-0 flex items-center justify-center [perspective:1000px] [transform-style:preserve-3d]">
        <TunnelText text="OFFLINE FIRST" delay={0} x={-400} y={-200} />
        <TunnelText text="REST CLIENT" delay={2000} x={400} y={200} />
        <TunnelText text="NATIVE DESKTOP" delay={4000} x={-300} y={300} />
        <TunnelText text="JSON DB" delay={6000} x={300} y={-300} />
        <TunnelText text="UNLIMITED COLLECTIONS" delay={1000} x={0} y={-400} />
      </div>

      {/* The Pilot (Bike Logo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 mix-blend-screen scale-75 md:scale-100">
        <ShowcaseLogoAnimation size={200} />
      </div>

      {/* Center Content */}
      <motion.div
        style={{ y }}
        className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-[100vw]"
      >
        {/* Tech Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md transform hover:scale-105 transition-transform duration-300 cursor-cell shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
          </span>
          <span className="text-gray-300 text-xs font-mono tracking-widest uppercase font-bold">
            System {version || 'v1.0.0-beta'} // Active
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-display font-black tracking-tighter text-white mb-6 leading-[0.9]"
        >
          The API client
          <br /> built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            pure speed.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="max-w-2xl text-gray-400 font-sans text-sm sm:text-lg md:text-xl font-medium mb-10 px-2 leading-relaxed"
        >
          Debug APIs, organize requests, and write tests without leaving your keyboard.
          <br className="hidden sm:block" />
          <span className="text-gray-300 font-bold mt-2 inline-block">
            Local JSON Database. Powerful Request Builder. Manage environments with ease.
          </span>
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-col items-center gap-4 w-full px-4 sm:px-0"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <Button
              onClick={() => {
                window.location.href = currentPlatform.url;
              }}
              className="group relative w-full sm:w-auto h-14 px-8 bg-white rounded-full text-black font-semibold hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 text-sm md:text-base overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <currentPlatform.icon className="w-5 h-5 shrink-0 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="truncate relative z-10">
                Download for {platform === 'other' ? 'Desktop' : platform}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowAllDownloads(!showAllDownloads)}
              className="w-full sm:w-auto h-14 px-8 rounded-full border-white/10 bg-white/5 backdrop-blur-md text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Other Platforms{' '}
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform text-gray-400',
                  showAllDownloads && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {showAllDownloads && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex flex-wrap justify-center gap-4 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
            >
              {Object.entries(platformInfo).map(
                ([key, info]) =>
                  key !== 'other' && (
                    <a
                      key={key}
                      href={info.url}
                      className="group flex items-center gap-2 px-4 py-2 text-xs font-mono text-gray-400 hover:text-white transition-all duration-300 uppercase border border-transparent hover:border-white/10 rounded-full hover:bg-white/5"
                    >
                      <info.icon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      {info.label}
                    </a>
                  )
              )}
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 text-xs font-mono text-gray-400 hover:text-white transition-all duration-300 uppercase hover:bg-white/5 rounded-full"
              >
                All Releases
              </a>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom Specs */}
      <div className="hidden sm:flex absolute bottom-6 md:bottom-10 left-0 right-0 px-6 md:px-10 justify-between text-[10px] md:text-xs font-mono text-gray-700 uppercase tracking-widest pointer-events-none">
        <div>
          STACK: ELECTRON + REACT
          <br />
          STORAGE: JSON DB
        </div>
        <div className="text-right">
          STATUS: ONLINE
          <br />
          ENVIRONMENT: LOCAL
        </div>
      </div>
    </section>
  );
}
