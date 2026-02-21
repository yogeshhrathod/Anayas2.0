import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function ProductShot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);

  return (
    <section
      ref={containerRef}
      className="bg-black py-32 perspective-[2000px] overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-24 max-w-3xl text-center mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Professional Grade
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-black tracking-tight text-white mb-6"
          >
            A workspace that <br/> feels like <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">home.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl font-medium"
          >
            Built from the ground up for speed. An interface designed to get out of your way so you can focus on building.
          </motion.p>
        </div>

        <motion.div
          style={{ scale, opacity, rotateX, transformStyle: 'preserve-3d' }}
          className="relative w-full max-w-6xl mx-auto z-10"
        >
          {/* Main App Window Glow */}
          <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-blue-500/30 blur-2xl rounded-[32px] opacity-70" />
          
          {/* Main App Window Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-2xl ring-1 ring-white/10 mx-auto flex flex-col">
            


            {/* App Content Area */}
            <div className="relative w-full aspect-[16/10] bg-zinc-950 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}product-shot.png`}
                alt="Luna Interface"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
            </div>
          </div>

          {/* Floor Reflection */}
          <div className="absolute -bottom-12 left-10 right-10 h-32 bg-indigo-500/10 blur-[80px] pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
