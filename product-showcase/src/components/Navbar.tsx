import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLatestRelease } from '../hooks/useLatestRelease';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const { releaseUrl } = useLatestRelease();

  useMotionValueEvent(scrollY, 'change', latest => {
    setIsScrolled(latest > 50);
  });

  const links: { name: string; href: string; external: boolean }[] = [
    { name: 'About', href: '/about', external: false },
    // { name: 'Docs', href: '/docs', external: false },
  ];

  return (
    <motion.nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-black/90 backdrop-blur-md border-white/10 py-4'
          : 'bg-transparent border-transparent py-6'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Using the Bike Logo Animation scaled down */}
            <span className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Luna Logo"
              className="w-full h-full object-contain relative z-10"
            />
          </div>
          <span className="font-display font-bold text-xl tracking-tighter uppercase text-white">
            Luna<span className="text-primary">_</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          <div className="flex gap-8">
            {links.map(link =>
              link.href.startsWith('/') && !link.href.startsWith('/#') ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              )
            )}
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/yogeshhrathod/Anayas2.0"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Button
              size="sm"
              onClick={() => (window.location.href = releaseUrl)}
              className="rounded-none bg-white text-black font-bold uppercase tracking-widest border border-white hover:bg-transparent hover:text-white transition-all"
            >
              Download Alpha
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-6">
            {links.length > 0 &&
              links.map(link => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-sm font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            {links.length > 0 && <hr className="border-white/10" />}
            <Button
              className="w-full h-12 rounded-none bg-primary text-black font-bold uppercase tracking-widest mt-2 hover:bg-primary/90 transition-all border border-primary hover:shadow-[0_0_20px_rgba(255,100,0,0.3)]"
              onClick={() => {
                setMobileMenuOpen(false);
                window.location.href = releaseUrl;
              }}
            >
              Download Alpha
            </Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
