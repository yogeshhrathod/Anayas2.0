import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section
      id="manifesto"
      ref={containerRef}
      className="bg-black text-white py-32 overflow-hidden relative border-t border-white/10"
    >
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 flex items-center gap-4">
            <div className="h-[1px] bg-primary w-12" />
            <span className="text-primary font-mono text-sm uppercase tracking-widest">
              Manifesto_Init_01
            </span>
          </div>

          <h2 className="text-5xl md:text-[5.5rem] font-display font-black tracking-tighter leading-[0.9] mb-12 mix-blend-exclusion">
            The Ultimate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Desktop Client.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12 font-mono text-sm md:text-base text-gray-400 tracking-wide leading-relaxed mb-24">
            <p>
              <strong className="text-white block mb-4 uppercase">
                The Mission
              </strong>
              Browser-based tools are limited. They rely on the cloud. They leak
              data. You deserve a tool that owns the machine it runs on.
            </p>
            <p>
              <strong className="text-white block mb-4 uppercase text-sm font-bold tracking-widest border-b border-white/10 pb-2">
                The Architecture
              </strong>
              A native Desktop App. Local JSON Database. React and Electron powered core.
              Lightning fast IPC. Luna_ combines the flexibility of the
              web with the raw power of the desktop.
            </p>
          </div>

          {/* Scenarios Grid */}
          <div className="grid md:grid-cols-3 gap-8 relative z-10 perspective-[1000px]">
            {[
              {
                title: 'DEBUG',
                desc: 'Inspect headers, payloads, and timing with surgical precision. No hidden proxies.',
              },
              {
                title: 'TEST',
                desc: 'Write tests with confidence. Validate responses, headers, and schemas quickly.',
              },
              {
                title: 'ORGANIZE',
                desc: 'Environment variables, collections, and history synced to your local repo.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.05, translateY: -10 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.05] transition-colors group shadow-2xl backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-colors duration-500 z-0" />
                <div className="relative z-10">
                  <div className="text-indigo-400 border-b border-white/10 pb-3 font-black text-2xl mb-5 group-hover:translate-x-2 transition-transform tracking-tight flex items-center gap-3">
                    <span className="text-sm font-mono text-cyan-400/50">0{i + 1}</span>
                    {item.title}
                  </div>
                  <p className="font-sans text-sm md:text-base text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Kinetic Text */}
      <motion.div
        style={{ x }}
        className="absolute -bottom-20 left-0 whitespace-nowrap opacity-5 pointer-events-none"
      >
        <span className="text-[12rem] font-display font-bold uppercase">
          Speed Precision Power Speed Precision Power
        </span>
      </motion.div>
    </section>
  );
}
