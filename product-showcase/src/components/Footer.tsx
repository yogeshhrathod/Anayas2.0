import { Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 bg-black border-t border-white/10">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Luna Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg text-white">Luna</span>
          </div>

          <div className="text-sm text-gray-500">
            © 2026 Luna. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
