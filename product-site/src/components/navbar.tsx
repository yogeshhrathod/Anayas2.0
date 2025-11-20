"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 flex justify-center py-4 transition-all duration-300",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <nav
        className={cn(
          "flex items-center justify-between px-6 py-2 rounded-full border transition-all duration-300",
          scrolled
            ? "w-[90%] md:w-[70%] bg-secondary/70 backdrop-blur-md border-border shadow-lg"
            : "w-full max-w-7xl border-transparent bg-transparent"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Anayas
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </a>
          <Button size="sm" className="rounded-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
