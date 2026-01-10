import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { Logo } from "./Logo";

interface BikeLogoAnimationProps {
  size?: number;
  className?: string;
}

export function BikeLogoAnimation({ size = 120, className }: BikeLogoAnimationProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden h-[200px] w-[300px]", className)}>
        {/* Speed lines backdrop - creates sense of speed */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-30">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="h-[2px] bg-primary/40 rounded-full w-full"
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
          y: [0, -4, 0], // Bounce
          rotate: [0, 2, 0], // Slight tilt for effort/speed
        }}
        transition={{
          repeat: Infinity,
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        <div className="relative transform -rotate-6"> {/* Forward lean base */}
            <Logo size={size} />
             {/* Wheel spin effect (subtle blur or circular motion hint could go here if the logo had distinct wheels, 
                 but for a general logo, we just bounce/tilt) */}
        </div>
        
        {/* Wind streaks attached to the bike */}
        <motion.div 
            className="absolute top-1/2 -right-10 w-12 h-[2px] bg-sky-400/50 blur-sm"
            animate={{ opacity: [0, 0.8, 0], x: [0, -20] }}
            transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
        />
        <motion.div 
            className="absolute top-1/4 -right-8 w-8 h-[2px] bg-sky-400/50 blur-sm"
            animate={{ opacity: [0, 0.6, 0], x: [0, -15] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
        />
      </motion.div>

      {/* The Road */}
      <div className="absolute bottom-10 w-[150%] h-[120px] bg-gradient-to-b from-transparent to-muted/10 transform perspective-[500px] rotate-x-60">
        <div className="relative w-full h-full">
            {/* Moving road markings */}
            <motion.div
                className="absolute top-1/2 left-0 w-full h-[4px] bg-dashed-line"
                style={{
                    backgroundImage: "linear-gradient(90deg, transparent 50%, var(--foreground) 50%)",
                    backgroundSize: "60px 100%",
                    opacity: 0.2
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
        className="absolute bottom-14 w-20 h-2 bg-black/20 rounded-[100%] blur-sm"
        animate={{
            scaleX: [1, 0.9, 1],
            opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
            repeat: Infinity,
            duration: 0.4,
            ease: "easeInOut"
        }}
      />
    </div>
  );
}
