import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface ShowcaseLogoAnimationProps {
  size?: number;
  className?: string;
}

export function ShowcaseLogoAnimation({ size = 120, className }: ShowcaseLogoAnimationProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden h-[300px] w-full max-w-[500px]", className)}>
        {/* Speed lines backdrop - creates sense of speed */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="h-[2px] bg-blue-500/40 rounded-full w-full"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: "-100%", opacity: [0, 1, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.5,
                        delay: Math.random() * 0.5,
                        ease: "linear",
                    }}
                    style={{
                        top: `${Math.random() * 100}%`,
                        width: `${50 + Math.random() * 50}%`
                    }}
                />
            ))}
        </div>

      {/* The "Bike" (Logo) */}
      <motion.div
        className="relative z-10"
        animate={{
          y: [0, -10, 0], // Bounce
          rotate: [0, 2, 0], // Slight tilt for effort/speed
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      >
        <div className="relative transform -rotate-6"> {/* Forward lean base */}
            <div className="relative z-10 rounded-2xl p-4">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Luna Logo" style={{ width: size, height: size }} className="object-contain drop-shadow-2xl" />
            </div>
             {/* Wheel spin effect (subtle blur or circular motion hint) */}
        </div>
        
        {/* Wind streaks attached to the bike */}
        <motion.div 
            className="absolute top-1/2 -right-20 w-32 h-[2px] bg-cyan-400/50 blur-sm"
            animate={{ opacity: [0, 0.8, 0], x: [0, -40] }}
            transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
        />
        <motion.div 
            className="absolute top-1/4 -right-16 w-24 h-[2px] bg-blue-400/50 blur-sm"
            animate={{ opacity: [0, 0.6, 0], x: [0, -30] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
        />
      </motion.div>

      {/* The Road */}
      <div className="absolute bottom-0 w-[200%] h-[150px] bg-gradient-to-b from-transparent to-blue-900/10 transform perspective-[500px] rotate-x-60 pointer-events-none">
        <div className="relative w-full h-full">
            {/* Moving road markings */}
            <motion.div
                className="absolute top-1/2 left-0 w-full h-[4px] bg-dashed-line"
                style={{
                    backgroundImage: "linear-gradient(90deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                    backgroundSize: "60px 100%",
                    opacity: 0.4
                }}
                animate={{
                    backgroundPositionX: ["0px", "-60px"]
                }}
                transition={{
                    repeat: Infinity,
                    duration: 0.2,
                    ease: "linear"
                }}
            />
        </div>
      </div>
      
      {/* Shadow */}
      <motion.div
        className="absolute bottom-10 w-32 h-4 bg-black/40 rounded-[100%] blur-md"
        animate={{
            scaleX: [1, 0.9, 1],
            opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
        }}
      />
    </div>
  );
}
