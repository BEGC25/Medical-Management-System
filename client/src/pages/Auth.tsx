import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Shield, Users, Activity, User, Lock, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";
import clinicLogo from "@assets/Logo-Clinic_1760859723870.jpeg";
import CenterDivider from "@/components/CenterDivider";

// Floating particles configuration
const PARTICLE_CONFIG = {
  COUNT: 10,
  SIZE_MIN: 10,
  SIZE_MAX: 30,
  DURATION_MIN: 30,
  DURATION_MAX: 60,
  DELAY_MAX: 10,
  OPACITY_MIN: 0.2,
  OPACITY_MAX: 0.5,
} as const;

// Central glow gradient configuration
const CENTRAL_GLOW_GRADIENT = 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 40%, transparent 70%)';

export default function Auth() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Generate floating particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_CONFIG.COUNT }, (_, i) => ({
      id: i,
      size: Math.random() * (PARTICLE_CONFIG.SIZE_MAX - PARTICLE_CONFIG.SIZE_MIN) + PARTICLE_CONFIG.SIZE_MIN,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * (PARTICLE_CONFIG.DURATION_MAX - PARTICLE_CONFIG.DURATION_MIN) + PARTICLE_CONFIG.DURATION_MIN,
      delay: Math.random() * PARTICLE_CONFIG.DELAY_MAX,
      opacity: Math.random() * (PARTICLE_CONFIG.OPACITY_MAX - PARTICLE_CONFIG.OPACITY_MIN) + PARTICLE_CONFIG.OPACITY_MIN,
    }));
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(loginForm);
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate("/");
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.15,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 animate-gradient-shift" />
      
      {/* Subtle Background Texture Overlay - Premium hex pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          opacity: prefersReducedMotion ? 1 : undefined,
          animation: prefersReducedMotion ? 'none' : 'texture-drift 120s linear infinite',
        }}
      />
      
      {/* Central Radial Glow - Unifying Element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            background: CENTRAL_GLOW_GRADIENT,
          }}
        />
      </div>

      {/* Floating Particles - Gentle Dreamy Effect */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-blue-400/20 blur-xl animate-float-particle"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                opacity: particle.opacity,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-gentle" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-gentle-delay-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-float-gentle-delay-4" />

      {/* Center Divider with Animated EKG Pattern */}
      <CenterDivider />

      {/* Left Panel - Login Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <motion.div 
              className="flex items-center justify-center mb-6"
              variants={logoVariants}
            >
              <div className="relative shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-2xl opacity-20 animate-glow-pulse" />
                <img 
                  src={clinicLogo} 
                  alt="Bahr El Ghazal Clinic Logo" 
                  className="h-48 w-48 object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-teal-100 bg-clip-text text-transparent mb-3 tracking-tight leading-tight">
              Bahr El Ghazal Clinic
            </h1>
            <p className="text-blue-200/80 text-lg font-normal leading-relaxed">
              <span className="font-semibold">Comprehensive Healthcare</span> Management System
            </p>
          </motion.div>

          {/* Glassmorphic Login Card */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl shadow-blue-900/20 shimmer-effect relative overflow-hidden">
              <CardHeader className="relative z-10 space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-blue-100/70 text-base">
                  Sign in to access the clinic management system
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Username Input */}
                  <motion.div 
                    className="space-y-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Label htmlFor="login-username" className="text-white/90 font-medium flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-300" />
                      Username
                    </Label>
                    <div className="relative input-premium-glow rounded-lg">
                      <Input
                        id="login-username"
                        data-testid="input-username"
                        type="text"
                        value={loginForm.username}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, username: e.target.value })
                        }
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 focus:scale-[1.01] h-12 px-4 text-base backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/40"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password Input */}
                  <motion.div 
                    className="space-y-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Label htmlFor="login-password" className="text-white/90 font-medium flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-blue-300" />
                      Password
                    </Label>
                    <div className="relative input-premium-glow rounded-lg">
                      <Input
                        id="login-password"
                        data-testid="input-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 focus:scale-[1.01] h-12 px-4 text-base backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/40"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Premium Button */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-500 hover:via-blue-400 hover:to-teal-400 text-white shadow-lg shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/70 transition-all duration-300 ease-out relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                      data-testid="button-login"
                      disabled={loginMutation.isPending}
                    >
                      {/* Shimmer effect on button */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loginMutation.isPending ? (
                          prefersReducedMotion ? (
                            <>
                              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'none' }} />
                              Signing in...
                            </>
                          ) : (
                            <>
                              {/* Premium ECG loading animation */}
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-ekg-button-tick">
                                <path
                                  d="M 2 12 L 6 12 L 8 8 L 10 16 L 12 4 L 14 20 L 16 12 L 18 12 L 22 12"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                />
                              </svg>
                              Signing in...
                            </>
                          )
                        ) : (
                          <>
                            <Heart className="h-5 w-5" />
                            Sign In
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Feature Showcase */}
      <motion.div 
        className="hidden lg:flex flex-1 p-12 items-center justify-center relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-5xl-premium font-bold mb-4">
              <span className="font-bold">Comprehensive </span>
              <span className="font-bold bg-gradient-to-r from-blue-200 via-teal-200 to-blue-300 bg-clip-text text-transparent">Healthcare</span>
              <span className="font-normal bg-gradient-to-r from-white via-blue-100 to-teal-100 bg-clip-text text-transparent"> Management</span>
            </h2>
            <p className="text-blue-100/80 mb-10 text-lg-refined">
              Empowering rural healthcare delivery in South Sudan with modern digital tools
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {/* Feature 1 - Secure & Private */}
            <motion.div
              custom={0}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 ease-out cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30 shadow-lg shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all duration-300">
                  <Shield className="h-7 w-7 text-blue-300 group-hover:scale-110 motion-safe:group-hover:rotate-3 transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-blue-100 transition-colors duration-300">
                    Secure & Private
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed group-hover:text-blue-100/80 transition-colors duration-300">
                    Patient data protected with enterprise-grade security and encryption
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 - Multi-Department Support */}
            <motion.div
              custom={1}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 ease-out cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 group-hover:from-teal-500/30 group-hover:to-teal-600/30 shadow-lg shadow-teal-500/10 group-hover:shadow-teal-500/20 transition-all duration-300">
                  <Users className="h-7 w-7 text-teal-300 group-hover:scale-110 motion-safe:group-hover:rotate-3 transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-teal-100 transition-colors duration-300">
                    Multi-Department Support
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed group-hover:text-blue-100/80 transition-colors duration-300">
                    Coordinated care across reception, laboratory, radiology, and pharmacy
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 - Comprehensive Tracking */}
            <motion.div
              custom={2}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-out cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 shadow-lg shadow-purple-500/10 group-hover:shadow-purple-500/20 transition-all duration-300">
                  <Activity className="h-7 w-7 text-purple-300 group-hover:scale-110 motion-safe:group-hover:rotate-3 transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-purple-100 transition-colors duration-300">
                    Comprehensive Tracking
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed group-hover:text-blue-100/80 transition-colors duration-300">
                    Complete patient journey from registration to treatment completion
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 4 - Medical Excellence */}
            <motion.div
              custom={3}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-pink-400/40 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 ease-out cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 group-hover:from-pink-500/30 group-hover:to-pink-600/30 shadow-lg shadow-pink-500/10 group-hover:shadow-pink-500/20 transition-all duration-300">
                  <Stethoscope className="h-7 w-7 text-pink-300 group-hover:scale-110 motion-safe:group-hover:rotate-3 transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-pink-100 transition-colors duration-300">
                    Medical Excellence
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed group-hover:text-blue-100/80 transition-colors duration-300">
                    World-class healthcare tools designed for African healthcare delivery
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
