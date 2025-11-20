"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Play, Server, Database, Code2 } from "lucide-react";

export function InteractiveDemo() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSend = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setResponse(null);

    // Simulate network request
    setTimeout(() => {
      setResponse(JSON.stringify({ status: 200, message: "Hello from Anayas!", data: { id: 1, speed: "fast" } }, null, 2));
      setIsAnimating(false);
    }, 2000);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Experience the Speed
          </h2>
          <p className="text-muted-foreground text-lg">
            Visualize the request flow in real-time.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-12 relative z-10">
            {/* Client */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                <Code2 className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-blue-400">Client</span>
            </div>

            {/* Server */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                <Server className="w-8 h-8 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-purple-400">Server</span>
            </div>

            {/* Database */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                <Database className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-emerald-500">Database</span>
            </div>
          </div>

          {/* Connection Lines */}
          <div className="absolute top-24 left-8 right-8 h-0.5 bg-neutral-800 -z-0" />

          {/* Animated Beam */}
          {isAnimating && (
            <motion.div
              initial={{ left: "10%", opacity: 0 }}
              animate={{ 
                left: ["10%", "50%", "90%", "50%", "10%"],
                opacity: [0, 1, 1, 1, 0]
              }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute top-24 h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent -translate-y-1/2 blur-sm z-0"
            />
          )}

          <div className="flex justify-center mb-8">
            <Button 
              size="lg" 
              onClick={handleSend} 
              disabled={isAnimating}
              className="min-w-[150px]"
            >
              {isAnimating ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce mr-1"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce mr-1 delay-75"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                </span>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>

          {/* Response Window */}
          <div className="bg-black/80 rounded-lg border border-neutral-800 p-4 font-mono text-sm min-h-[150px] relative overflow-hidden">
            <div className="flex gap-2 mb-4 border-b border-neutral-800 pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <AnimatePresence mode="wait">
              {response ? (
                <motion.pre
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-400"
                >
                  {response}
                </motion.pre>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-neutral-500 flex items-center justify-center h-full"
                >
                  Waiting for request...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
