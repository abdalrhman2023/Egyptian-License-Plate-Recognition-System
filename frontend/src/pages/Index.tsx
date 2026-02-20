import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Bell, Zap, Play, ChevronRight, Eye, Cpu, BarChart3, Lock, ArrowRight, Check } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "120K+", label: "Vehicles Scanned" },
  { value: "98.5%", label: "Accuracy Rate" },
  { value: "24/7", label: "Uptime" },
  { value: "<50ms", label: "Detection Speed" },
];

const features = [
  { icon: Shield, title: "Egyptian Plate Mastery", desc: "Optimized for Egyptian & Arabic plates with 95%+ accuracy across all governorates and plate formats.", color: "text-primary" },
  { icon: Bell, title: "Real-Time Alerts", desc: "Instant watchlist matching, violation detection, and push notifications to security teams.", color: "text-accent" },
  { icon: Zap, title: "Smart Integration", desc: "Seamless integration with existing CCTV, access control, and security management systems.", color: "text-success" },
  { icon: Eye, title: "Live Monitoring", desc: "Multi-camera feed with AI-powered detection overlays and real-time analytics dashboard.", color: "text-primary" },
  { icon: Cpu, title: "Edge Processing", desc: "On-device AI processing for minimal latency and maximum reliability even offline.", color: "text-accent" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Traffic patterns, violation trends, and actionable insights powered by machine learning.", color: "text-success" },
];

const pricing = [
  { name: "Starter", price: "$299", period: "/month", desc: "For small compounds", features: ["Up to 4 cameras", "500 detections/day", "Basic analytics", "Email alerts", "7-day data retention"], cta: "Start Free Trial" },
  { name: "Professional", price: "$799", period: "/month", desc: "For large facilities", features: ["Up to 16 cameras", "Unlimited detections", "Advanced analytics", "SMS + Email alerts", "90-day data retention", "Watchlist management", "API access"], cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "Custom", period: "", desc: "For smart city deployments", features: ["Unlimited cameras", "Unlimited detections", "Custom analytics", "All alert channels", "Unlimited retention", "Dedicated support", "Custom integrations", "SLA guarantee"], cta: "Contact Sales" },
];

const techStack = ["YOLOv11", "PaddleOCR", "PyTorch", "FastAPI", "TensorRT", "CUDA"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">Sentry Vision</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              AI-Powered Security Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
              Intelligent License Plate Recognition for{" "}
              <span className="text-gradient-primary">Modern Egypt</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              AI-Powered Security • Real-Time Monitoring • Smart City Ready. Deploy enterprise-grade LPR across compounds, universities, and cities.
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Start Free Trial <ChevronRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-border text-foreground hover:bg-secondary transition-all">
                <Play className="w-4 h-4" /> Watch Demo
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-6 md:gap-10"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-heading font-bold text-gradient-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">Enterprise-Grade <span className="text-gradient-primary">Capabilities</span></h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Built for mission-critical deployments where accuracy, speed, and reliability are non-negotiable.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6"
              >
                <f.icon className={`w-8 h-8 mb-4 ${f.color}`} />
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="technology" className="py-16 border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted-foreground font-medium">Powered by cutting-edge AI</p>
            <div className="flex flex-wrap gap-3">
              {techStack.map((t) => (
                <span key={t} className="px-4 py-2 rounded-lg text-xs font-mono font-medium border border-border bg-secondary/50 text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">Simple, Transparent <span className="text-gradient-accent">Pricing</span></h2>
            <p className="text-muted-foreground">Start small, scale to an entire city. No hidden fees.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 flex flex-col ${p.popular ? "ring-2 ring-primary relative" : ""}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground">Most Popular</span>
                )}
                <h3 className="font-heading font-bold text-lg">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-heading font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    p.popular
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
                <Shield className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-sm">Sentry Vision</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" /> End-to-end encrypted • SOC 2 compliant • GDPR ready
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Sentry Vision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
