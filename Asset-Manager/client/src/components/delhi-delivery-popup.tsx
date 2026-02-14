import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, MapPin } from "lucide-react";

const DELHI_KEYWORDS = ["delhi", "new delhi", "south delhi", "north delhi", "east delhi", "west delhi", "central delhi"];
const SESSION_KEY = "delhiPopupClosed";
const CITY_CACHE_KEY = "userCity";

function isDelhi(city: string): boolean {
  const lower = city.toLowerCase().trim();
  return DELHI_KEYWORDS.some((kw) => lower.includes(kw));
}

async function detectCity(): Promise<string | null> {
  // 1. Check localStorage cache first (fast)
  try {
    const cached = localStorage.getItem(CITY_CACHE_KEY);
    if (cached && cached.trim()) return cached.trim();
  } catch {}

  // 2. Fetch from free IP geolocation API
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.region || "";
      if (city) {
        try { localStorage.setItem(CITY_CACHE_KEY, city); } catch {}
        return city;
      }
    }
  } catch {}

  // 3. Fallback API
  try {
    const res = await fetch("https://ip-api.com/json/?fields=city,regionName", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.regionName || "";
      if (city) {
        try { localStorage.setItem(CITY_CACHE_KEY, city); } catch {}
        return city;
      }
    }
  } catch {}

  return null;
}

export function DelhiDeliveryPopup() {
  const [visible, setVisible] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Already closed this session? Don't show.
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {}

    let cancelled = false;

    detectCity().then((city) => {
      if (cancelled) return;
      if (city && isDelhi(city)) {
        setDetectedCity(city);
        // Small delay so page renders first
        setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 1500);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  };

  // Auto-close after 8 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(handleClose, 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9999]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#F5A623]/30 bg-gradient-to-r from-[#1a1200] via-[#0d0d0d] to-[#1a1200] shadow-2xl shadow-[#F5A623]/10 p-5">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#F5A623]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span className="text-xs text-[#F5A623] font-medium uppercase tracking-wider">
                    {detectedCity || "Delhi"}
                  </span>
                </div>
                <h3 className="text-white font-bold text-base leading-tight mb-1">
                  🎉 FREE Delivery for You!
                </h3>
                <p className="text-gray-400 text-sm leading-snug">
                  Enjoy <span className="text-[#F5A623] font-semibold">free delivery</span> + express{" "}
                  <span className="text-[#F5A623] font-semibold">30-minute</span> shipping in Delhi!
                </p>
              </div>
            </div>

            {/* Progress bar (auto-close indicator) */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5A623]/50 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
