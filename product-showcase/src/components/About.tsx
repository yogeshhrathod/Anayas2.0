import { motion } from 'framer-motion';

export function About() {
  return (
    <section id="about" className="py-24 bg-zinc-950 border-t border-white/5">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
             <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for the <br /> modern stack.</h2>
             <p className="text-lg text-muted-foreground mb-6">
               We tired of clunky, slow API clients that consume gigabytes of RAM just to send a GET request. 
               We built Luna to be the antithesis of that.
             </p>
             <p className="text-lg text-muted-foreground mb-8">
               Native performance, minimal footprint, and a UI that stays out of your way. 
               Whether you're debugging a local server or testing production endpoints, Luna is your reliable companion.
             </p>

             <div className="grid grid-cols-2 gap-8">
                <div>
                   <div className="text-4xl font-bold text-blue-500 mb-1">50ms</div>
                   <div className="text-sm text-gray-400">Average Boot Time</div>
                </div>
                <div>
                   <div className="text-4xl font-bold text-purple-500 mb-1">100%</div>
                   <div className="text-sm text-gray-400">Offline Capable</div>
                </div>
             </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative"
          >
             <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                {/* Abstract shape */}
                <div className="relative w-64 h-64">
                   <div className="absolute inset-0 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob" />
                   <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-2000" />
                   <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-4000" />
                   
                   <div className="relative z-10 w-full h-full border border-white/20 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center">
                      <span className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                        Zero
                        <br/>
                        Bloat
                      </span>
                   </div>
                </div>
             </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
