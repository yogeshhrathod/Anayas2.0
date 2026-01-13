import { motion, useScroll, useTime, useTransform } from 'framer-motion';
import { Apple, ChevronDown, Terminal as Linux, Terminal, Monitor as Windows } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { ShowcaseLogoAnimation } from './ShowcaseLogoAnimation';
import { Button } from './ui/Button';

const TunnelText = ({ text, delay = 0, x = 0, y = 0 }: { text: string, delay?: number, x?: number, y?: number }) => {
  const time = useTime();
  
  // Z-axis movement loop
  const z = useTransform(time, (t) => {
    const period = 8000; // Time for one full cycle
    const offset = (t + delay) % period;
    // Map time to distance: starts far (-2000), comes close (1000)
    return -2000 + (offset / period) * 3000;
  });

  const fade = useTransform(z, [-2000, -500, 500, 1000], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ z, x, y, opacity: fade, position: 'absolute', left: '50%', top: '50%' }}
      className="text-6xl md:text-[10rem] font-bold text-white/5 whitespace-nowrap font-display pointer-events-none select-none uppercase tracking-tighter"
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        {text}
      </div>
    </motion.div>
  );
};

import { useLatestRelease } from '../hooks/useLatestRelease';

// ... (TunnelText component remains unchanged)

export function Hero() {
  const ref = useRef(null);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | 'other'>('other');
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
    other: { label: 'Download Luna', icon: Terminal, url: releaseUrl }
  };

  const currentPlatform = platformInfo[platform];
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center perspective-[1000px]">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        
        {/* Tunnel Effect */}
        <div className="absolute inset-0 flex items-center justify-center [perspective:1000px] [transform-style:preserve-3d]">
          <TunnelText text="ZERO LATENCY" delay={0} x={-400} y={-200} />
          <TunnelText text="PURE FLOW" delay={2000} x={400} y={200} />
          <TunnelText text="HYPER VELOCITY" delay={4000} x={-300} y={300} />
          <TunnelText text="NO LIMITS" delay={6000} x={300} y={-300} />
          <TunnelText text="BUILD FASTER" delay={1000} x={0} y={-400} />
        </div>

        {/* The Pilot (Bike Logo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 mix-blend-screen scale-75 md:scale-100">
             <ShowcaseLogoAnimation size={200} />
        </div>

        {/* Center Content */}
        <motion.div style={{ y }} className="relative z-10 flex flex-col items-center text-center mt-32">
            {/* Tech Badge */}
            <div className="mb-8 flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-none transform hover:scale-105 transition-transform duration-300 cursor-cell">
                <Terminal className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-primary text-xs font-mono tracking-widest uppercase">System {version || 'v0.0.1-alpha'} // Active</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-9xl font-display font-bold uppercase tracking-tighter text-white mb-6 mix-blend-exclusion">
                Code at the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-500 to-gray-900 animate-pulse">Speed of Thought</span>
            </h1>

            <p className="max-w-xl text-gray-500 font-mono text-sm md:text-base uppercase tracking-widest mb-12">
                [ The API Client designed for flow state ]<br/>
                Local First. Privacy Focused. Professional Grade.
            </p>

            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <Button 
                      onClick={() => {
                        window.location.href = currentPlatform.url;
                      }}
                      className="h-14 px-8 bg-primary rounded-none text-black font-bold uppercase tracking-widest hover:bg-primary/90 transition-all border border-primary hover:shadow-[0_0_30px_rgba(255,100,0,0.3)] flex items-center gap-3"
                    >
                        <currentPlatform.icon className="w-5 h-5" />
                        Download for {platform === 'other' ? 'Desktop' : platform}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllDownloads(!showAllDownloads)}
                      className="h-14 px-8 rounded-none border-white/20 text-white font-mono hover:bg-white hover:text-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        Platforms <ChevronDown className={cn("w-4 h-4 transition-transform", showAllDownloads && "rotate-180")} />
                    </Button>
                </div>

                {showAllDownloads && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap justify-center gap-4 p-4 bg-white/5 backdrop-blur-md border border-white/10"
                  >
                    {Object.entries(platformInfo).map(([key, info]) => (
                      key !== 'other' && (
                        <a 
                          key={key}
                          href={info.url}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-gray-400 hover:text-primary transition-colors uppercase border border-transparent hover:border-primary/20"
                        >
                          <info.icon className="w-3 h-3" />
                          {info.label}
                        </a>
                      )
                    ))}
                    <a 
                      href={releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-gray-400 hover:text-primary transition-colors uppercase"
                    >
                      All Releases
                    </a>
                  </motion.div>
                )}
            </div>
        </motion.div>

        {/* Bottom Specs */}
        <div className="absolute bottom-10 left-0 right-0 px-10 flex justify-between text-xs font-mono text-gray-700 uppercase tracking-widest">
            <div>
                LATENCY: 0.5ms<br/>
                MEMORY: 40MB
            </div>
            <div className="text-right">
                STATUS: ONLINE<br/>
                REGION: GLOBAL
            </div>
        </div>
    </section>
  );
}
