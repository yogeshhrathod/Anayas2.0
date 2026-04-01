import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Image, Video, FileText, Code2 } from 'lucide-react';

export function RichResponsesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  return (
    <section
      ref={containerRef}
      className="bg-black py-32 overflow-hidden relative"
    >
      <div className="absolute bottom-1/4 left-1/4 w-[800px] h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto mb-20 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold mb-6"
          >
            <Image className="h-4 w-4" />
            Vibrant Previews
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-black tracking-tight text-white mb-6"
          >
            Don't just see code. <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 text-6xl">See the result.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl leading-relaxed"
          >
            Testing media APIs? Luna_ renders images, plays videos, and parses PDFs directly in your response panel. Toggle between raw data and high-fidelity previews instantly.
          </motion.p>
        </div>

        <motion.div
          style={{ scale, opacity, y }}
          className="relative max-w-5xl mx-auto group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <img
              src={`${import.meta.env.BASE_URL}rich-responses-screenshot.png`}
              alt="Rich Response Viewer Interface"
              className="w-full h-auto"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            {[
              { icon: Image, label: "Image Previews" },
              { icon: Video, label: "Video Players" },
              { icon: FileText, label: "PDF Rendering" },
              { icon: Code2, label: "Advanced Formatting" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-white/5 text-red-400 group-hover:text-red-300 transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-gray-400 font-medium text-sm">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
