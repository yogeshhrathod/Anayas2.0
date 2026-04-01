import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Command, Search, Zap, MousePointer2 } from 'lucide-react';

export function CommandPaletteShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <section
      ref={containerRef}
      className="bg-black py-32 overflow-hidden relative"
    >
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            style={{ scale, opacity, x }}
            className="order-2 lg:order-1 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              <img
                src={`${import.meta.env.BASE_URL}command-palette-screenshot.png`}
                alt="Command Palette Interface"
                className="w-full h-auto transform group-hover:rotate-1 group-hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold w-fit"
            >
              <Command className="h-4 w-4" />
              Keyboard-first Design
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-black tracking-tight text-white"
            >
              Navigate at the <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">speed of thought.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl leading-relaxed"
            >
              The Command Palette is the heart of Luna_. Toggle environments, jump to requests, or run tests without ever touching your mouse. It's fuzzy search, refined.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {[
                { icon: Search, title: "Fuzzy Search", desc: "Find anything instantly with partial matches." },
                { icon: Zap, title: "Global Actions", desc: "Run shortcuts from anywhere in the app." },
                { icon: Command, title: "Shortcuts", desc: "Native keybinds for every operation." },
                { icon: MousePointer2, title: "No Mouse Needed", desc: "Designed for total keyboard control." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
