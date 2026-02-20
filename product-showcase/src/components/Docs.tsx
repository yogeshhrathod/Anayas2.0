import { motion } from 'framer-motion';
import { Cpu, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';

export function Docs() {
  const [activeTab, setActiveTab] = useState<'api' | 'cli' | 'architecture'>(
    'api'
  );

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-8">
            <div>
              <h3 className="text-primary font-mono text-xs uppercase tracking-widest mb-4">
                Core Modules
              </h3>
              <nav className="flex flex-col space-y-1">
                {[
                  'Introduction',
                  'Installation',
                  'Authentication',
                  'Requests',
                  'Responses',
                ].map(item => (
                  <a
                    key={item}
                    href="#"
                    className="font-mono text-sm text-gray-400 hover:text-white transition-colors py-1 block"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <h3 className="text-primary font-mono text-xs uppercase tracking-widest mb-4">
                Advanced
              </h3>
              <nav className="flex flex-col space-y-1">
                {[
                  'Testing',
                  'Environment Vars',
                  'CI/CD Integration',
                  'Plugins',
                ].map(item => (
                  <a
                    key={item}
                    href="#"
                    className="font-mono text-sm text-gray-400 hover:text-white transition-colors py-1 block"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-12 border-b border-white/10 pb-8">
              <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight mb-4">
                System Manual
              </h1>
              <p className="text-xl text-gray-500 font-mono">
                v0.0.1-alpha // PREVIEW BUILD
              </p>
            </div>

            {/* Interactive Component Demo */}
            <div className="mb-16 border border-white/10 bg-white/5 p-1 rounded-none">
              <div className="flex border-b border-white/10 mb-4">
                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-6 py-3 font-mono text-sm uppercase transition-colors ${activeTab === 'api' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  API Reference
                </button>
                <button
                  onClick={() => setActiveTab('cli')}
                  className={`px-6 py-3 font-mono text-sm uppercase transition-colors ${activeTab === 'cli' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  CLI Tools
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={`px-6 py-3 font-mono text-sm uppercase transition-colors ${activeTab === 'architecture' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Internal Arch
                </button>
              </div>

              <div className="p-6 min-h-[300px] font-mono text-sm">
                {activeTab === 'api' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-primary mb-4">
                      GET /v1/system/status
                    </div>
                    <div className="text-gray-400 mb-2">// Response schema</div>
                    <pre className="text-gray-300 bg-black/50 p-4 overflow-x-auto">
                      {`{
  "status": "operational",
  "latency": "0.4ms",
  "modules": [
    "network: active",
    "storage: mounted",
    "encryption: secured"
  ]
}`}
                    </pre>
                  </motion.div>
                )}
                {activeTab === 'cli' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-primary mb-4">
                      $ luna run --test ./spec/*
                    </div>
                    <div className="text-gray-400 mb-2">// Output stream</div>
                    <div className="space-y-1 text-gray-300">
                      <div>[INIT] Loading configuration... OK</div>
                      <div>
                        [TEST] benchmarks/latency.spec.ts...{' '}
                        <span className="text-green-500">PASS (12ms)</span>
                      </div>
                      <div>
                        [TEST] integration/auth_flow.spec.ts...{' '}
                        <span className="text-green-500">PASS (45ms)</span>
                      </div>
                      <div>[DONE] All systems nominal.</div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'architecture' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-white/10 p-4">
                        <Cpu className="w-6 h-6 text-primary mb-2" />
                        <div className="font-bold mb-1">Core Engine</div>
                        <div className="text-gray-500 text-xs">
                          Rust-based IO layer for zero-latency request handling.
                        </div>
                      </div>
                      <div className="border border-white/10 p-4">
                        <Shield className="w-6 h-6 text-primary mb-2" />
                        <div className="font-bold mb-1">Vault</div>
                        <div className="text-gray-500 text-xs">
                          AES-256 encrypted local storage for sensitive tokens.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Text Content */}
            <div className="prose prose-invert max-w-none">
              <h3 className="font-display text-2xl uppercase tracking-tight text-white mb-4 flex items-center gap-2">
                <Zap className="text-primary" /> Rapid Implementation
              </h3>
              <p className="text-gray-400 font-mono leading-relaxed mb-8">
                Luna is designed to be drop-in ready. It parses your existing
                OpenAPI/Swagger definitions and instantly generates a testable
                collection. No configuration required. Just point to your schema
                and start sending requests.
              </p>

              <Button className="h-14 px-8 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 rounded-none w-full md:w-auto">
                Read Full Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
