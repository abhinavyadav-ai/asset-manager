import { Navbar, Footer } from "@/components/layout";
import { Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { SiTelegram, SiWhatsapp, SiInstagram } from "react-icons/si";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-3 px-5 py-2.5 glass-card rounded-full text-xs uppercase tracking-[0.25em] text-white/80 font-medium mb-8">
              <MessageCircle className="w-4 h-4 gold-text" />
              Get in Touch
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-[0.95]">
              Let's <span className="gold-gradient-text font-semibold" style={{ textShadow: '0 0 40px rgba(245, 166, 35, 0.3)' }}>Connect</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto text-lg font-light">
              Have questions? We'd love to hear from you. Reach out through any of our channels below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: SiWhatsapp,
              title: "WhatsApp",
              subtitle: "Quick Response",
              value: "+91 92795 47350",
              href: "https://wa.me/919279547350?text=Hi! I have a question about Luxe Candle",
              color: "bg-green-500",
              hoverColor: "hover:bg-green-500/20",
            },
            {
              icon: Mail,
              title: "Email",
              subtitle: "Write to Us",
              value: "luxebyras@gmail.com",
              href: "mailto:luxebyras@gmail.com",
              color: "bg-primary",
              hoverColor: "hover:bg-primary/20",
            },
            {
              icon: SiInstagram,
              title: "Instagram",
              subtitle: "Follow Us",
              value: "@_luxecandle_",
              href: "https://instagram.com/_luxecandle_",
              color: "bg-gradient-to-br from-purple-500 to-pink-500",
              hoverColor: "hover:bg-purple-500/20",
            },
          ].map((contact, i) => (
            <motion.a
              key={contact.title}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`neo-card p-8 rounded-2xl ${contact.hoverColor} transition-all group cursor-pointer`}
              data-testid={`link-${contact.title.toLowerCase()}`}
            >
              <div className={`w-14 h-14 ${contact.color} rounded-2xl flex items-center justify-center mb-6`}>
                <contact.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{contact.subtitle}</p>
              <h3 className="font-serif text-2xl text-white mb-2 group-hover:gold-text transition-colors">{contact.title}</h3>
              <p className="text-white/60">{contact.value}</p>
            </motion.a>
          ))}
        </div>
      </section>

      {/* More Ways to Connect */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">More Options</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mt-4">
              Other Ways to <span className="gold-gradient-text">Reach Us</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Telegram */}
            <motion.a
              href="https://t.me/luxecandle00"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="neo-card p-8 rounded-2xl hover:border-blue-500/30 transition-all group flex items-center gap-6"
              data-testid="link-telegram"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <SiTelegram className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-white mb-1 group-hover:text-blue-400 transition-colors">Telegram</h3>
                <p className="text-muted-foreground">@luxecandle00</p>
                <p className="text-xs text-white/40 mt-2">Join our channel for updates</p>
              </div>
            </motion.a>

            {/* Business Hours */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="neo-card p-8 rounded-2xl flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-8 h-8 gold-text" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-white mb-1">Business Hours</h3>
                <p className="text-muted-foreground">Mon - Sat: 10AM - 8PM</p>
                <p className="text-xs text-white/40 mt-2">Sunday: 12PM - 6PM</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="gold-text text-sm uppercase tracking-[0.3em] font-bold">FAQs</span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mt-4">
              Common <span className="gold-gradient-text">Questions</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "How long do your candles burn?",
                a: "Our standard candles have a burn time of 50+ hours. The exact duration depends on the candle size and how it's maintained.",
              },
              {
                q: "Do you offer custom orders?",
                a: "Yes! We love creating custom candles for special occasions. Contact us via WhatsApp to discuss your requirements.",
              },
              {
                q: "What is your shipping policy?",
                a: "We offer free shipping on orders above ₹999. Standard delivery takes 3-5 business days across India.",
              },
              {
                q: "Are your candles eco-friendly?",
                a: "Absolutely! We use 100% natural coconut apricot wax, lead-free cotton wicks, and recyclable packaging.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="neo-card p-6 rounded-xl"
              >
                <h4 className="font-serif text-lg text-white mb-2">{faq.q}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl text-white mb-6">
              Ready to Order?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Browse our collection or message us directly for personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/shop"
                className="gold-button inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full uppercase tracking-widest text-sm font-bold"
                data-testid="button-shop-now"
              >
                Shop Now
              </a>
              <a 
                href="https://wa.me/919279547350"
                target="_blank"
                rel="noopener noreferrer"
                className="gold-outline-button inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full uppercase tracking-widest text-sm font-bold"
                data-testid="button-message-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
                Message Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
