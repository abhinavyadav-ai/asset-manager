import { Share2, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  url?: string;
  price?: number;
}

export function SocialShare({ title, url, price }: SocialShareProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  const shareOnWhatsApp = () => {
    const text = price 
      ? `Check out ${title} for ₹${price} at Luxe Candle! ${shareUrl}`
      : `Check out ${title} at Luxe Candle! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowMenu(false);
  };
  
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Product link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-5 py-3 neo-card rounded-xl text-white/80 hover:text-white transition-colors"
        data-testid="button-share"
      >
        <Share2 className="w-5 h-5" />
        <span className="font-medium">Share</span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-2 z-50 neo-card rounded-xl p-2 min-w-[180px]"
            >
              <button
                onClick={shareOnWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="text-white">WhatsApp</span>
              </button>
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                data-testid="button-share-copy"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Link2 className="w-5 h-5 gold-text" />
                )}
                <span className="text-white">{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
