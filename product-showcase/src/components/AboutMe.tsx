import { motion, useInView } from 'framer-motion';
import {
  Code2,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Package,
  Terminal,
  Zap
} from 'lucide-react';
import { useRef } from 'react';

/* ─────────────────────────── data ─────────────────────────── */

const AVATAR_URL = 'https://avatars.githubusercontent.com/u/46518134?v=4';

const skills = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Node.js'] },
  { category: 'Frontend', items: ['React', 'Vite', 'Electron', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Express', 'NestJS', 'REST APIs'] },
  { category: 'Tools & DevOps', items: ['Git', 'GitHub Actions', 'Docker', 'CI/CD'] },
  { category: 'Platforms', items: ['VS Code Extensions', 'NPM Packages', 'MCP Servers', 'Electron Apps'] },
  { category: 'Specialties', items: ['Developer Tooling', 'API Clients', 'Dev-Experience', 'Open Source'] },
];

const projects = [
  {
    name: 'Luna_',
    desc: 'A modern, Electron-based REST API client reimagined from the ground up. Built for speed, collections, environments, and developer joy.',
    lang: 'TypeScript',
    url: 'https://github.com/yogeshhrathod/Anayas2.0',
    highlight: true,
  },
  {
    name: 'JiraMCP',
    desc: 'MCP (Model Context Protocol) server that exposes Jira APIs to AI assistants — bridging project management and AI workflows.',
    lang: 'JavaScript',
    url: 'https://github.com/yogeshhrathod/JiraMCP',
    highlight: false,
  },
  {
    name: 'BitbucketMCP 1.0',
    desc: 'MCP server for Bitbucket — lets LLMs interact with pull requests, repos and pipelines via natural language.',
    lang: 'TypeScript',
    url: 'https://github.com/yogeshhrathod/BitbucketMCP1.0',
    highlight: false,
  },
  {
    name: 'Inline JSON Formatter',
    desc: 'VSCode extension that instantly formats or stringifies selected JSON/JS objects with customisable indentation.',
    lang: 'JavaScript',
    url: 'https://github.com/yogeshhrathod/inline-json-formatter',
    highlight: false,
  },
  {
    name: 'Scooty',
    desc: 'A slick frontend project delivered with modern JavaScript patterns and component-driven architecture.',
    lang: 'JavaScript',
    url: 'https://github.com/yogeshhrathod/Scooty',
    highlight: false,
  },
  {
    name: 'rememberIt',
    desc: 'CLI tool to bookmark directories and files so you can jump to them instantly — remember your workspace with ease.',
    lang: 'TypeScript',
    url: 'https://github.com/yogeshhrathod/rememberIt',
    highlight: false,
  },
];

const timeline = [
  {
    year: '2026',
    role: 'Software Engineer',
    company: 'Qualys',
    desc: 'Working on enterprise-grade security tooling while building open-source developer tools on the side.',
  },
  {
    year: '2025',
    role: 'Open Source Builder',
    company: 'Self-directed',
    desc: 'Launched Luna_, JiraMCP, BitbucketMCP — building tools that make developers\' lives measurably better.',
  },
  {
    year: '2024',
    role: 'Full Stack Developer',
    company: 'Qualys',
    desc: 'Shipped production features, published NPM packages, and explored Electron app development.',
  },
  {
    year: '2021',
    role: 'Developer & Creator',
    company: 'Various Projects',
    desc: 'Built Luna_ v1, VS Code themes, express scaffolds, and dived deep into the open-source ecosystem.',
  },
  {
    year: '2019',
    role: 'Started Coding Journey',
    company: 'GitHub Joined',
    desc: 'First commit. Never looked back.',
  },
];

const stats = [
  { label: 'Public Repos', value: '47+', icon: Github },
  { label: 'NPM Packages', value: '3+', icon: Package },
  { label: 'VS Code Extensions', value: '2', icon: Code2 },
  { label: 'Languages Used', value: '6+', icon: Terminal },
];

/* ─────────────────────── sub-components ──────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] text-primary uppercase mb-4">
      <span className="w-4 h-px bg-primary" />
      {children}
    </span>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export function AboutMe() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-32 overflow-x-hidden">
      {/* ════════ HERO ════════ */}
      <section className="relative container mx-auto px-4 md:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-16 lg:py-24">
        {/* Grid BG */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex-shrink-0"
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl scale-110 animate-pulse" />
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-primary/60 overflow-hidden shadow-[0_0_50px_rgba(255,102,0,0.25)]">
            <img
              src={AVATAR_URL}
              alt="Yogesh Rathod"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Text */}
        <div className="relative flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SectionLabel>About me</SectionLabel>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-none tracking-tighter text-white">
              Yogesh<br />
              <span className="text-primary">Rathod</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base md:text-lg text-gray-400 max-w-xl leading-relaxed normal-case tracking-normal"
          >
            Software Engineer at <span className="text-white font-semibold">Qualys</span>, based in{' '}
            <span className="text-white font-semibold">Pune, India</span>. I build developer tools, VS Code
            extensions, Electron apps, and MCP servers that make other engineers' lives easier.
            Open source enthusiast who ships, not just starts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 justify-center lg:justify-start"
          >
            <a
              href="https://github.com/yogeshhrathod"
              target="_blank"
              rel="noreferrer"
              id="about-github-link"
              className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/rathod-yogesh/"
              target="_blank"
              rel="noreferrer"
              id="about-linkedin-link"
              className="inline-flex items-center gap-2 border border-white/30 text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-200"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
            <a
              href="mailto:yrathod33@gmail.com"
              id="about-email-link"
              className="inline-flex items-center gap-2 border border-white/10 text-gray-400 px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:border-white/40 hover:text-white transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex items-center gap-2 text-gray-500 text-sm font-mono normal-case tracking-normal"
          >
            <MapPin className="w-3.5 h-3.5" />
            Pune, Maharashtra, India
          </motion.div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="border-y border-white/10 py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-white/10 border border-white/10">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.08}>
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 group hover:bg-white/5 transition-colors">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <span className="text-3xl font-bold font-display text-white tracking-tight">{stat.value}</span>
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest text-center">{stat.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ABOUT NARRATIVE ════════ */}
      <section className="container mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-16 items-start">
        <FadeIn>
          <div>
            <SectionLabel>Who I am</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tighter text-white mb-6">
              I build tools for<br />
              <span className="text-primary">developers</span>, by a developer.
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed normal-case tracking-normal text-base">
              <p>
                I'm a software engineer who gets frustrated by bad developer tooling — so I build better ones.
                From REST clients to VS Code extensions, MCP servers to CLI utilities, everything I ship is
                driven by real pain points I've encountered in the day-to-day.
              </p>
              <p>
                At <strong className="text-white">Qualys</strong>, I work on enterprise security software where
                reliability, performance, and developer experience are non-negotiable. Outside work, I pour
                that same energy into open source projects like <strong className="text-primary">Luna_</strong> —
                a full-featured Electron REST client that rivals the best in the space.
              </p>
              <p>
                I believe the best tools get out of your way. Clean APIs, sharp UIs, zero friction.
                That philosophy drives every line of code I write.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-gray-400 normal-case tracking-normal">
                Currently building: Luna_ — an Electron REST client
              </span>
            </div>
          </div>
        </FadeIn>
      </section>


      {/* ════════ CTA ════════ */}
      <section className="border-t border-white/10">
        <FadeIn>
          <div className="container mx-auto px-4 md:px-6 py-24 text-center flex flex-col items-center gap-8">
            <SectionLabel>Let's connect</SectionLabel>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-white max-w-2xl">
              Ready to build something <span className="text-primary">great</span> together?
            </h2>
            <p className="text-gray-400 text-base max-w-lg leading-relaxed normal-case tracking-normal">
              I'm open to full-time roles, contract work, and interesting open-source collaborations.
              If your team values developer experience, clean architecture, and shipping — let's talk.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://www.linkedin.com/in/rathod-yogesh/"
                target="_blank"
                rel="noreferrer"
                id="cta-linkedin"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary transition-all"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
              <a
                href="https://github.com/yogeshhrathod"
                target="_blank"
                rel="noreferrer"
                id="cta-github"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:border-white transition-all"
              >
                <Github className="w-4 h-4" />
                Explore my GitHub
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
