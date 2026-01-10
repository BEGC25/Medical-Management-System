import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Shield, Users, Activity, User, Lock, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";
import clinicLogo from "@assets/Logo-Clinic_1760859723870.jpeg";

export default function Auth() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

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
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-gentle" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '4s' }} />

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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-2xl opacity-20 animate-glow-pulse" />
                <img 
                  src={clinicLogo} 
                  alt="Bahr El Ghazal Clinic Logo" 
                  className="h-48 w-48 object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-teal-100 bg-clip-text text-transparent mb-3 tracking-tight">
              Bahr El Ghazal Clinic
            </h1>
            <p className="text-blue-200/80 text-lg font-medium">
              Comprehensive Healthcare Management System
            </p>
          </motion.div>

          {/* Glassmorphic Login Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Shimmer Effect Overlay */}
              <div className="absolute inset-0 opacity-50">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer-slide" />
              </div>
              
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
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor="login-username" className="text-white/90 font-medium flex items-center gap-2">
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
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 h-12 px-4 text-base backdrop-blur-sm transition-all duration-300"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password Input */}
                  <motion.div 
                    className="space-y-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor="login-password" className="text-white/90 font-medium flex items-center gap-2">
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
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 h-12 px-4 text-base backdrop-blur-sm transition-all duration-300"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Premium Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-500 hover:via-blue-400 hover:to-teal-400 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all duration-300 relative overflow-hidden group"
                      data-testid="button-login"
                      disabled={loginMutation.isPending}
                    >
                      {/* Shimmer effect on button */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loginMutation.isPending ? (
                          <>
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing in...
                          </>
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
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-teal-100 bg-clip-text text-transparent leading-tight">
              Comprehensive Healthcare Management
            </h2>
            <p className="text-blue-100/80 mb-10 text-lg leading-relaxed">
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
              whileHover={{ scale: 1.03, x: 10 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                  <Shield className="h-7 w-7 text-blue-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-blue-100 transition-colors">
                    Secure & Private
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed">
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
              whileHover={{ scale: 1.03, x: 10 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 group-hover:from-teal-500/30 group-hover:to-teal-600/30 transition-all duration-300">
                  <Users className="h-7 w-7 text-teal-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-teal-100 transition-colors">
                    Multi-Department Support
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed">
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
              whileHover={{ scale: 1.03, x: 10 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                  <Activity className="h-7 w-7 text-purple-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-purple-100 transition-colors">
                    Comprehensive Tracking
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed">
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
              whileHover={{ scale: 1.03, x: 10 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 group-hover:from-pink-500/30 group-hover:to-pink-600/30 transition-all duration-300">
                  <Stethoscope className="h-7 w-7 text-pink-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1.5 group-hover:text-pink-100 transition-colors">
                    Medical Excellence
                  </h3>
                  <p className="text-sm text-blue-100/70 leading-relaxed">
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
