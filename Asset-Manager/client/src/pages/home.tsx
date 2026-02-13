import { Navbar, Footer } from "@/components/layout";
import { ArrowRight, Sparkles, Star, Flame, Zap, Clock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { FlashSale } from "@shared/schema";

export default function Home() {
  // Fetch active flash sale
  const { data: flashSale } = useQuery<FlashSale | null>({
    queryKey: ['/api/flash-sales/active'],
    queryFn: async () => {
      const res = await fetch('/api/flash-sales/active');
      if (!res.ok) return null;
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      
      {/* Flash Sale Banner */}
      {flashSale && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-[#F5A623]/20 via-[#F5A623]/10 to-[#F5A623]/20 border-y border-[#F5A623]/30 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-4 text-center">
              <Zap className="w-5 h-5 text-[#F5A623] animate-pulse" />
              <div className="flex items-center gap-3">
                <span className="text-[#F5A623] font-bold text-lg">{flashSale.title}</span>
                {flashSale.discountPercent && (
                  <span className="bg-[#F5A623] text-black px-3 py-1 rounded-full text-sm font-bold">
                    {flashSale.discountPercent}% OFF
                  </span>
                )}
                {flashSale.description && (
                  <span className="text-white/80 text-sm hidden sm:inline">
                    {flashSale.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                <span>Ends {new Date(flashSale.endDate).toLocaleDateString('en-IN')}</span>
              </div>
              <Link 
                href="/shop" 
                className="gold-button px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                data-testid="link-flash-sale-shop"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Full Screen Hero */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1570823336316-09a8f4c34898?q=80&w=2670&auto=format&fit=crop" 
            alt="Luxury Candle" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/60 rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full text-xs uppercase tracking-[0.3em] text-white/90 font-medium">
              <Flame className="w-4 h-4 gold-text animate-pulse" />
              Handcrafted Luxury Since 2020
              <Flame className="w-4 h-4 gold-text animate-pulse" />
            </span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="font-serif text-6xl md:text-8xl lg:text-9xl text-white mt-10 mb-8 leading-[0.9] tracking-tight"
          >
            <span className="block font-light">Illuminate</span>
            <span className="block gold-gradient-text font-semibold" style={{ textShadow: '0 0 60px rgba(245, 166, 35, 0.4)' }}>
              Your World
            </span>
          </motion.h1>
          
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-white/60 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-light tracking-wide"
          >
            Premium hand-poured luxury candles crafted with passion
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/shop" 
              className="gold-button inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full uppercase tracking-[0.2em] text-sm font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all"
              data-testid="button-explore-shop"
            >
              Explore Collection
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="https://wa.me/919279547350?text=Hi! I want to order candles"
              target="_blank"
              rel="noopener noreferrer"
              className="gold-outline-button inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full uppercase tracking-[0.2em] text-sm font-bold"
              data-testid="button-whatsapp-order"
            >
              WhatsApp Order
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium">Scroll</span>
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "Burn Hours", icon: Flame },
              { value: "100%", label: "Natural Wax", icon: Sparkles },
              { value: "5000+", label: "Happy Customers", icon: Star },
              { value: "Zero", label: "Toxins", icon: Sparkles },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                viewport={{ once: true }}
                className="text-center p-6 neo-card rounded-2xl"
              >
                <stat.icon className="w-6 h-6 gold-text mx-auto mb-3" />
                <p className="text-3xl md:text-4xl font-serif gold-gradient-text font-semibold">{stat.value}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">Explore</span>
            <h2 className="font-serif text-4xl md:text-5xl text-white mt-4">
              Discover <span className="gold-gradient-text">Luxe Candle</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Shop",
                desc: "Browse our premium collection of handcrafted candles",
                href: "/shop",
                image: "https://images.unsplash.com/photo-1596516109370-29001ec8ec36?w=800&q=80",
              },
              {
                title: "About",
                desc: "Learn about our artisanal craftsmanship and story",
                href: "/about",
                image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
              },
              {
                title: "Contact",
                desc: "Get in touch for custom orders and inquiries",
                href: "/contact",
                image: "https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=800&q=80",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Link 
                  href={card.href}
                  className="group block relative overflow-hidden rounded-2xl aspect-[4/5] neo-card"
                  data-testid={`card-nav-${card.title.toLowerCase()}`}
                >
                  <img 
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="font-serif text-3xl text-white mb-2 group-hover:gold-text transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">{card.desc}</p>
                    <span className="inline-flex items-center gap-2 gold-text text-sm uppercase tracking-wider font-bold group-hover:gap-4 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
