import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="group relative p-2.5 rounded-xl
                 bg-white/10 dark:bg-gray-700/30
                 hover:bg-white/20 dark:hover:bg-gray-600/40
                 text-white
                 border border-white/30 dark:border-gray-500/30
                 shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                 hover:shadow-[0_4px_12px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.12)]
                 transition-all duration-300 ease-out
                 hover:scale-[1.05] hover:rotate-12
                 backdrop-blur-sm"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 
                     dark:-rotate-90 dark:scale-0 text-white
                     group-hover:scale-110 group-hover:rotate-45" />
      <Moon className="absolute top-2.5 left-2.5 h-5 w-5 rotate-90 scale-0 transition-all duration-300 
                      dark:rotate-0 dark:scale-100 text-white
                      group-hover:scale-110" />
    </button>
  );
}
