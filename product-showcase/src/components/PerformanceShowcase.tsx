import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Activity, Zap, Target, BarChart3 } from 'lucide-react';

export function PerformanceShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <section
      ref={containerRef}
      className="bg-black py-32 overflow-hidden relative"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold w-fit"
            >
              <Activity className="h-4 w-4" />
              New: Performance Benchmark
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-black tracking-tight text-white"
            >
              Industrial-strength <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">stress testing.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl leading-relaxed"
            >
              Stress test your APIs with up to thousands of concurrent users directly from Luna_. Get real-time telemetry, latency distribution, and stream timelines to identify bottlenecks before your users do.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {[
                { icon: Zap, title: "High Throughput", desc: "Simulate massive loads effortlessly." },
                { icon: Target, title: "Precision Metrics", desc: "Nano-second precision latency tracking." },
                { icon: BarChart3, title: "Live Telemetry", desc: "Visual charts that update in real-time." },
                { icon: Activity, title: "Error Analysis", desc: "Deep dive into failed request patterns." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="p-2 rounded-lg bg-white/5 text-cyan-400">
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

          <motion.div
            style={{ scale, opacity, y }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              <img
                src={`${import.meta.env.BASE_URL}performance-screenshot.png`}
                alt="Performance Benchmark Interface"
                className="w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-700"
              />
              {/* Reflective Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
