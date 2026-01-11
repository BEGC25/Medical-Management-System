import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '-0.005em' }],
        'sm': ['0.875rem', { lineHeight: '1.5714', letterSpacing: '-0.006em' }],
        'base': ['1rem', { lineHeight: '1.625', letterSpacing: '-0.011em' }],
        'lg': ['1.125rem', { lineHeight: '1.5556', letterSpacing: '-0.014em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.017em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4167', letterSpacing: '-0.019em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3333', letterSpacing: '-0.021em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2778', letterSpacing: '-0.023em' }],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        '2xl': "1.25rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      borderWidth: {
        '3': '3px',
      },
      colors: {
        'medical-blue': 'var(--medical-blue)',
        'health-green': 'var(--health-green)',
        'attention-orange': 'var(--attention-orange)',
        'alert-red': 'var(--alert-red)',
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 0 1px 0 rgba(15, 23, 42, 0.02)',
        'md': '0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.08)',
        'lg': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 10px 20px -3px rgba(15, 23, 42, 0.12), 0 20px 35px -5px rgba(15, 23, 42, 0.06)',
        'xl': '0 8px 12px -2px rgba(15, 23, 42, 0.1), 0 20px 40px -5px rgba(15, 23, 42, 0.14), 0 30px 60px -8px rgba(15, 23, 42, 0.1)',
        'premium': '0 10px 40px -10px rgba(15, 23, 42, 0.16), 0 2px 6px -2px rgba(15, 23, 42, 0.06)',
        'premium-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        'premium-md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.05)',
        'premium-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.06)',
        'premium-xl': '0 20px 25px -5px rgba(15, 23, 42, 0.14), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
        'premium-2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.2)',
        'inner-premium': 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
        'glow-sm': '0 0 15px rgba(15, 23, 42, 0.1)',
        'glow-md': '0 0 25px rgba(15, 23, 42, 0.15)',
        'glow-lg': '0 0 40px rgba(15, 23, 42, 0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "subtle-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        "pulse-premium": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.92", transform: "scale(1.02)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "number-flip": {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        "float-particle": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-20px) translateX(10px)" },
          "50%": { transform: "translateY(-40px) translateX(-10px)" },
          "75%": { transform: "translateY(-20px) translateX(5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
        "subtle-pulse": "subtle-pulse 2s ease-in-out infinite",
        "pulse-premium": "pulse-premium 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "number-flip": "number-flip 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "float-particle": "float-particle 60s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
