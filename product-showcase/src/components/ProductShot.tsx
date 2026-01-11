import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function ProductShot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);

  return (
    <section ref={containerRef} className="bg-black py-32 perspective-[2000px] overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center mb-16">
            <h2 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white mb-6 text-center">
                Command <span className="text-primary">Center.</span>
            </h2>
            <p className="font-mono text-gray-500 uppercase tracking-widest text-sm">
                [ System Interface v0.0.1-alpha ]
            </p>
        </div>

        <motion.div 
            style={{ scale, opacity, rotateX, transformStyle: "preserve-3d" }}
            className="relative mx-auto max-w-6xl"
        >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-[30px] opacity-40" />

            {/* Mac Window Frame */}
            <div className="relative aspect-[16/10] bg-black/50 overflow-hidden group">
                    <img 
                        src={`${import.meta.env.BASE_URL}product-shot.png`} 
                        alt="Luna Interface" 
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]" 
                    />
                    
                    {/* Scanline Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
                </div>

            
            {/* Reflection/Grounding Shadow */}
            <div className="absolute top-full left-0 right-0 h-40 bg-gradient-to-b from-primary/10 to-transparent blur-2xl transform -scale-y-100 opacity-30 pointer-events-none" />

        </motion.div>
      </div>
    </section>
  );
}
