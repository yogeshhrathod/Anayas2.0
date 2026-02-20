import { motion } from 'framer-motion';
import { Clock, Command, Globe, Layout, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const features = [
  {
    title: 'Command Palette',
    description:
      'Navigate, run, and control everything without lifting your hands from the keyboard.',
    icon: Command,
    className: 'md:col-span-2',
  },
  {
    title: 'Request Builder',
    description:
      'Support for GET, POST, PUT, DELETE, and more with a powerful interface.',
    icon: Zap,
    className: 'md:col-span-1',
  },
  {
    title: 'Collections',
    description:
      'Organize requests into collections and share them with your team.',
    icon: Layout,
    className: 'md:col-span-1',
  },
  {
    title: 'Environments',
    description:
      'Switch between Local, Staging, and Production variables instantly.',
    icon: Globe,
    className: 'md:col-span-2',
  },
  {
    title: 'Request History',
    description:
      'Every request is saved automatically. Search and replay in seconds.',
    icon: Clock,
    className: 'md:col-span-3',
  },
];

const FeatureCard = ({
  title,
  description,
  icon: Icon,
  className,
  index,
}: {
  title: string;
  description: string;
  icon: any;
  className?: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    className={cn(
      'group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition-colors',
      className
    )}
  >
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
    <p className="text-muted-foreground">{description}</p>

    {/* Decorative gradient blob */}
    <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-colors" />
  </motion.div>
);

export function Features() {
  return (
    <section id="features" className="py-24 bg-black relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mb-16 md:text-center max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Luna is built to help you move faster, not get in your way.
            Experience a developer tool that actually feels like a developer
            tool.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
