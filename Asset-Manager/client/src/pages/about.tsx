import { Navbar, Footer } from "@/components/layout";
import { Sparkles, Leaf, Flame, Heart, Award, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=2574&auto=format&fit=crop"
            alt="Candle Making"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-3 px-5 py-2.5 glass-card rounded-full text-xs uppercase tracking-[0.25em] text-white/80 font-medium mb-8">
              <Heart className="w-4 h-4 gold-text" />
              Our Story
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-[0.95]">
              Crafted with <span className="gold-gradient-text font-semibold" style={{ textShadow: '0 0 40px rgba(245, 166, 35, 0.3)' }}>Passion</span>
            </h1>
            <p className="text-white/50 max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Every Luxe Candle is a labor of love, meticulously handcrafted to bring warmth, elegance, and tranquility into your space.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">Philosophy</span>
              <h2 className="font-serif text-4xl md:text-5xl text-white mt-4 mb-6 leading-tight">
                The Art of <span className="gold-gradient-text">Ambiance</span>
              </h2>
              <div className="space-y-6 text-white/60 leading-relaxed">
                <p>
                  At Luxe Candle, we believe that a candle is more than just a source of light—it's an experience. Our journey began with a simple desire: to create candles that transform ordinary moments into extraordinary memories.
                </p>
                <p>
                  Each candle is hand-poured in small batches using only the finest sustainable ingredients. We source our waxes from ethical suppliers and blend them with premium fragrance oils that have been carefully curated to evoke emotions and create lasting impressions.
                </p>
                <p>
                  From the first flicker to the last glow, our candles are designed to fill your space with captivating scents and a warm, ambient light that soothes the soul.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden neo-card">
                <img 
                  src="https://images.unsplash.com/photo-1594897030264-ab7d87efc473?q=80&w=2574&auto=format&fit=crop"
                  alt="Handcrafted Candle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl">
                <p className="gold-gradient-text text-4xl font-serif font-bold">Since</p>
                <p className="text-white text-5xl font-serif">2020</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">What We Stand For</span>
            <h2 className="font-serif text-4xl md:text-5xl text-white mt-4">
              Our <span className="gold-gradient-text">Values</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Premium Quality",
                desc: "We use only the finest ingredients—100% natural coconut apricot wax, lead-free cotton wicks, and phthalate-free fragrance oils.",
              },
              {
                icon: Leaf,
                title: "Sustainability",
                desc: "Our commitment to the environment guides every decision, from recyclable packaging to carbon-neutral shipping options.",
              },
              {
                icon: Flame,
                title: "Artisan Craft",
                desc: "Each candle is hand-poured with precision and care, ensuring consistent quality and a perfect burn every time.",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="neo-card p-8 rounded-2xl text-center group hover:border-primary/30 transition-colors"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <value.icon className="w-8 h-8 gold-text" />
                </div>
                <h3 className="font-serif text-2xl text-white mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Flame, value: "50+", label: "Hours Burn Time" },
              { icon: Award, value: "100%", label: "Natural Ingredients" },
              { icon: Users, value: "5000+", label: "Happy Customers" },
              { icon: Heart, value: "∞", label: "Love in Every Candle" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 gold-text mx-auto mb-4" />
                <p className="text-4xl md:text-5xl font-serif gold-gradient-text font-semibold mb-2">{stat.value}</p>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">Our Promise</span>
            <h2 className="font-serif text-4xl md:text-5xl text-white mt-4 mb-8">
              Every Candle Tells a <span className="gold-gradient-text">Story</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              When you light a Luxe Candle, you're not just illuminating a room—you're creating an atmosphere, a memory, a moment of pure tranquility. That's our promise to you.
            </p>
            <a 
              href="/shop"
              className="gold-button inline-flex items-center gap-3 px-10 py-5 rounded-full uppercase tracking-widest text-sm font-bold"
              data-testid="button-explore-collection"
            >
              Explore Our Collection
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
