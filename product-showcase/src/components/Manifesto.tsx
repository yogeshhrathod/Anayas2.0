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

          <h2 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none mb-12 mix-blend-exclusion">
            The Ultimate <br />
            <span className="text-primary">REST Client.</span>
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
              <strong className="text-white block mb-4 uppercase">
                The Architecture
              </strong>
              A professional Desktop App. Local SQLite Database. Native System
              Integration. Lightning fast IPC. Luna combines the freedom of the
              web with the power of the desktop.
            </p>
          </div>

          {/* Scenarios Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'DEBUG',
                desc: 'Inspect headers, payloads, and timing with surgical precision. No hidden proxies.',
              },
              {
                title: 'TEST',
                desc: 'Automated test runners built into your workflow. Validate schemas instantly.',
              },
              {
                title: 'ORGANIZE',
                desc: 'Environment variables, collections, and history synced to your local repo.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-white/10 p-6 hover:bg-white/5 transition-colors group"
              >
                <div className="text-primary font-bold text-xl mb-4 group-hover:translate-x-2 transition-transform">
                  0{i + 1} // {item.title}
                </div>
                <p className="font-mono text-sm text-gray-500">{item.desc}</p>
              </div>
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
