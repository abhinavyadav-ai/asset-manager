import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShippingPopup, setShowShippingPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Welcome to Luxe Candle! I'm your luxury candle concierge. How can I help you find the perfect fragrance today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (hasShownPopup) return;
    
    const timer = setTimeout(() => {
      setShowShippingPopup(true);
      setHasShownPopup(true);
      
      setTimeout(() => {
        setShowShippingPopup(false);
      }, 5000);
    }, 500); // Show instantly (0.5 seconds after page load)

    return () => clearTimeout(timer);
  }, [hasShownPopup]);

  const createConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Customer Support" }),
      });
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation();
        setConversationId(convId);
      }

      if (!convId) {
        throw new Error("Failed to create conversation");
      }

      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
                  )
                );
              }
            } catch {
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 w-[360px] h-[500px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(5, 5, 5, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(245, 166, 35, 0.2)",
            }}
            data-testid="chatbot-container"
          >
            <div
              className="flex items-center justify-between p-4"
              style={{
                background: "linear-gradient(135deg, rgba(245, 166, 35, 0.15), rgba(245, 166, 35, 0.05))",
                borderBottom: "1px solid rgba(245, 166, 35, 0.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #F5A623, #d4920f)" }}
                >
                  <MessageCircle className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Luxe Candle Concierge</h3>
                  <p className="text-xs text-gray-400">AI-Powered Support</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 text-gray-400 hover:text-white"
                data-testid="button-close-chat"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-col h-[calc(100%-140px)] overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "rounded-br-md"
                        : "rounded-bl-md"
                    }`}
                    style={{
                      background:
                        message.role === "user"
                          ? "linear-gradient(135deg, #F5A623, #d4920f)"
                          : "rgba(255, 255, 255, 0.08)",
                      color: message.role === "user" ? "#000" : "#fff",
                    }}
                    data-testid={`message-${message.role}-${message.id}`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div
                    className="px-4 py-3 rounded-2xl rounded-bl-md"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                  >
                    <Loader2 className="w-5 h-5 text-[#F5A623] animate-spin" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{
                background: "rgba(5, 5, 5, 0.98)",
                borderTop: "1px solid rgba(245, 166, 35, 0.1)",
              }}
            >
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about our candles..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#F5A623]/50"
                  disabled={isLoading}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-4"
                  style={{
                    background: "linear-gradient(135deg, #F5A623, #d4920f)",
                    color: "#000",
                  }}
                  data-testid="button-send-message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShippingPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              boxShadow: [
                "0 0 20px rgba(245, 166, 35, 0.2)",
                "0 0 40px rgba(245, 166, 35, 0.4)",
                "0 0 20px rgba(245, 166, 35, 0.2)"
              ]
            }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ 
              duration: 0.4, 
              type: "spring", 
              stiffness: 200,
              boxShadow: { duration: 2, repeat: Infinity }
            }}
            className="fixed bottom-24 right-4 z-50 p-5 rounded-2xl shadow-2xl max-w-[300px]"
            style={{
              background: "linear-gradient(135deg, rgba(5, 5, 5, 0.98), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(245, 166, 35, 0.4)",
            }}
            data-testid="shipping-popup"
          >
            <motion.div
              className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-2xl pointer-events-none"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(245, 166, 35, 0.1), transparent, rgba(245, 166, 35, 0.1))",
                  "linear-gradient(225deg, rgba(245, 166, 35, 0.1), transparent, rgba(245, 166, 35, 0.1))",
                  "linear-gradient(45deg, rgba(245, 166, 35, 0.1), transparent, rgba(245, 166, 35, 0.1))"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <button
              onClick={() => setShowShippingPopup(false)}
              className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors"
              data-testid="button-close-shipping-popup"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-4 relative">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <motion.div 
                  className="w-10 h-10 rounded-full flex items-center justify-center" 
                  style={{ background: "linear-gradient(135deg, #F5A623, #d4920f)" }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="w-5 h-5 text-black" />
                </motion.div>
                <div>
                  <p className="text-white font-semibold">Delhi: <span className="text-[#F5A623]">FREE</span> Delivery</p>
                  <p className="text-[#F5A623] text-sm font-medium">⚡ in 30 mins!</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                  <Truck className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">Other Cities: <span className="text-[#F5A623]">₹45</span> only</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="fixed bottom-6 right-6 z-50">
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: "rgba(245, 166, 35, 0.3)" }}
        />
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{
            background: "linear-gradient(135deg, #F5A623, #d4920f)",
            boxShadow: "0 4px 25px rgba(245, 166, 35, 0.5)",
          }}
          data-testid="button-toggle-chat"
        >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-black" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6 text-black" />
            </motion.div>
          )}
        </AnimatePresence>
        </motion.button>
      </motion.div>
    </>
  );
}
