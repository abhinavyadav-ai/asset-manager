import { Link, useLocation } from "wouter";
import { Flame, Menu, X, Instagram, ArrowUp, ShoppingBag, MessageCircle, Send, Heart, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useQuery } from "@tanstack/react-query";

function useLogo() {
  const { data: logoSetting } = useQuery<{ key: string; value: string } | null>({
    queryKey: ['/api/settings', 'logo_url'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/logo_url');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
  return logoSetting?.value || null;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const logoUrl = useLogo();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed w-full z-50 transition-all duration-500",
        scrolled ? "neo-glass py-4" : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer" data-testid="link-home">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Luxe Candle" 
                className="h-10 object-contain group-hover:scale-105 transition-transform duration-300"
                data-testid="img-navbar-logo"
              />
            ) : (
              <>
                <div className="relative">
                  <Flame className="h-8 w-8 gold-text group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 blur-xl bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-serif text-2xl tracking-wide font-bold text-foreground">
                  LUXE CANDLE
                </span>
              </>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={cn(
                  "px-5 py-2.5 text-sm font-medium tracking-wide transition-all rounded-xl uppercase hover-underline",
                  isActive(link.href) 
                    ? "gold-text bg-primary/10" 
                    : "text-foreground/60 hover:text-foreground hover:bg-white/5 hover:scale-105"
                )}
                data-testid={`nav-${link.name.toLowerCase()}`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Search Button */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="relative p-3 rounded-xl hover:bg-white/5 hover:scale-110 transition-all ml-2"
              data-testid="nav-search"
            >
              <Search className="w-5 h-5 text-foreground/60 hover:text-foreground transition-colors" />
            </button>

            {/* Wishlist Button */}
            <Link 
              href="/wishlist" 
              className="relative p-3 rounded-xl hover:bg-white/5 hover:scale-110 transition-all"
              data-testid="nav-wishlist"
            >
              <Heart className="w-5 h-5 text-foreground/60 hover:text-foreground transition-colors" />
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </motion.span>
              )}
            </Link>

            {/* Cart Button */}
            <Link 
              href="/cart" 
              className="relative p-3 rounded-xl hover:bg-white/5 hover:scale-110 transition-all"
              data-testid="nav-cart"
            >
              <ShoppingBag className="w-5 h-5 text-foreground/60 hover:text-foreground transition-colors" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>
            
            <Link 
              href="/shop" 
              className="gold-button ml-4 px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-xl"
              data-testid="button-shop-now"
            >
              Shop Now
            </Link>
          </div>

          {/* Search Overlay */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 p-4 neo-glass"
              >
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for candles..."
                    className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50"
                    autoFocus
                    data-testid="input-search"
                  />
                  <button
                    type="submit"
                    className="gold-button px-6 py-3 rounded-xl font-bold"
                    data-testid="button-search-submit"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    data-testid="button-search-close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Cart */}
            <Link 
              href="/cart" 
              className="relative p-3 rounded-xl hover:bg-white/5 transition-colors"
              data-testid="nav-cart-mobile"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 rounded-xl hover:bg-white/5 transition-colors"
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden absolute top-full left-0 w-full neo-glass overflow-hidden"
          >
            <div className="px-4 py-8 space-y-2 flex flex-col">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-5 py-4 text-base font-medium tracking-wide rounded-xl transition-colors",
                    isActive(link.href) ? "gold-text bg-white/5" : "text-foreground hover:bg-white/5"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                href="/products" 
                onClick={() => setIsOpen(false)}
                className="gold-button mt-4 text-center px-5 py-4 text-sm font-bold uppercase tracking-wider rounded-xl"
              >
                Shop Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative pt-24 pb-12 border-t border-white/5 noise-texture">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Flame className="h-8 w-8 gold-text" />
              <span className="font-serif text-2xl font-bold">LUXE CANDLE</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Handcrafted luxury candles made with sustainable soy wax and premium fragrance oils. Illuminate your world.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="https://instagram.com/_luxecandle_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl neo-card flex items-center justify-center hover:border-primary/30 transition-all group glow-ring"
                data-testid="link-instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground group-hover:gold-text transition-colors" />
              </a>
              <a 
                href="https://t.me/luxecandle00"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl neo-card flex items-center justify-center hover:border-primary/30 transition-all group glow-ring"
                data-testid="link-telegram"
              >
                <Send className="w-5 h-5 text-muted-foreground group-hover:gold-text transition-colors" />
              </a>
              <a 
                href="https://wa.me/919279547350"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl neo-card flex items-center justify-center hover:border-primary/30 transition-all group glow-ring"
                data-testid="link-whatsapp-social"
              >
                <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:gold-text transition-colors" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-xl mb-8 text-foreground">Shop</h4>
            <ul className="space-y-4 text-sm">
              {["All Candles", "New Arrivals", "Gift Sets", "Best Sellers"].map((item) => (
                <li key={item}>
                  <Link href="/products" className="text-muted-foreground hover:gold-text transition-colors inline-flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-3 h-px bg-primary transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-xl mb-8 text-foreground">Support</h4>
            <ul className="space-y-4 text-sm">
              {[
                { name: "Contact Us", href: "/contact" },
                { name: "Shipping Policy", href: "#" },
                { name: "Returns", href: "#" },
                { name: "Admin Login", href: "/login" }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-muted-foreground hover:gold-text transition-colors inline-flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-3 h-px bg-primary transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <a 
                  href="https://wa.me/919279547350?text=Hi! I have a question about Luxe Candle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-green-500 transition-colors inline-flex items-center gap-2 group"
                  data-testid="link-whatsapp-footer"
                >
                  <span className="w-0 group-hover:w-3 h-px bg-green-500 transition-all" />
                  WhatsApp Us
                </a>
              </li>
              <li>
                <a 
                  href="mailto:luxebyras@gmail.com"
                  className="text-muted-foreground hover:gold-text transition-colors inline-flex items-center gap-2 group"
                  data-testid="link-email-footer"
                >
                  <span className="w-0 group-hover:w-3 h-px bg-primary transition-all" />
                  luxebyras@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-xl mb-8 text-foreground">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-6">Subscribe for exclusive offers and updates.</p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-secondary/50 border border-white/10 px-5 py-4 text-sm rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                data-testid="input-newsletter-email"
              />
              <button className="gold-button w-full px-5 py-4 text-sm uppercase tracking-wider rounded-xl font-bold" data-testid="button-newsletter-join">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="premium-divider mb-10" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} Luxe Candle. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:gold-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:gold-text transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 left-8 gold-button p-4 rounded-full z-50"
            data-testid="button-scroll-top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
