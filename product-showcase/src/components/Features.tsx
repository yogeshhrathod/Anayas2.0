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
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
    viewport={{ once: true, margin: "-50px" }}
    whileHover={{ y: -8, scale: 1.02 }}
    className={cn(
      'group relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 hover:bg-white/[0.05] transition-all duration-500 backdrop-blur-md shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)]',
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500 z-0" />
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all duration-300 ring-1 ring-white/10 group-hover:ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] group-hover:scale-110">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed font-medium group-hover:text-gray-300 transition-colors">{description}</p>
    </div>

    {/* Decorative gradient blob */}
    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500 ease-out z-0 group-hover:scale-150" />
  </motion.div>
);

export function Features() {
  return (
    <section id="features" className="py-24 bg-black relative">
      {/* Background Grid Pattern */}
      <div className="absolute flex flex-col items-center justify-center inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto relative z-10 px-4 md:px-6">
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
            className="text-lg text-gray-400 font-medium"
          >
            Luna_ is built to help you move faster, not get in your way.
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
