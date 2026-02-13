import { useAuth } from "@/hooks/use-auth";
import { useProducts, useCreateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { useUpload } from "@/hooks/use-upload";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  LogOut, 
  Package, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Loader2, 
  Search,
  Flame,
  TrendingUp,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  BarChart3,
  Edit3,
  AlertTriangle,
  Eye,
  Calendar,
  Package2,
  X,
  Save,
  Tag,
  Percent,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  Settings,
  Home,
  Wallet,
  Star,
  Zap,
  Gift
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertCouponSchema, insertReviewSchema, insertBulkDiscountSchema, insertFlashSaleSchema, ORDER_STATUSES } from "@shared/schema";
import type { InsertProduct, Order, OrderItem, Product, Coupon, InsertCoupon, Review, BulkDiscount, FlashSale } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ViewType = "dashboard" | "products" | "product-edit" | "orders" | "coupons" | "reviews" | "bulk-discounts" | "flash-sales" | "settings";

export default function AdminDashboard() {
  const { user, logoutMutation, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleEditProduct = (productId: number) => {
    setEditingProductId(productId);
    setActiveView("product-edit");
  };

  const handleAddProduct = () => {
    setEditingProductId(null);
    setActiveView("product-edit");
  };

  const handleBackToProducts = () => {
    setEditingProductId(null);
    setActiveView("products");
  };

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="h-7 w-7 gold-text" />
              <span className="font-serif text-xl font-bold hidden sm:block">LUXE CANDLE</span>
            </Link>
            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium uppercase tracking-wider">
              Admin
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              Welcome, <span className="text-foreground font-medium">{user.username}</span>
            </span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 px-6 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: "dashboard" as const, icon: BarChart3, label: "Dashboard" },
            { id: "products" as const, icon: Package, label: "Products" },
            { id: "orders" as const, icon: ShoppingBag, label: "Orders" },
            { id: "coupons" as const, icon: Tag, label: "Coupons" },
            { id: "reviews" as const, icon: Star, label: "Reviews" },
            { id: "bulk-discounts" as const, icon: Gift, label: "Bulk Discounts" },
            { id: "flash-sales" as const, icon: Zap, label: "Flash Sales" },
            { id: "settings" as const, icon: Settings, label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeView === tab.id || (activeView === "product-edit" && tab.id === "products")
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DashboardView />
            </motion.div>
          )}
          {activeView === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProductsListView onEdit={handleEditProduct} onAdd={handleAddProduct} />
            </motion.div>
          )}
          {activeView === "product-edit" && (
            <motion.div
              key="product-edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProductEditView productId={editingProductId} onBack={handleBackToProducts} />
            </motion.div>
          )}
          {activeView === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrdersView />
            </motion.div>
          )}
          {activeView === "coupons" && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CouponsView />
            </motion.div>
          )}
          {activeView === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ReviewsView />
            </motion.div>
          )}
          {activeView === "bulk-discounts" && (
            <motion.div
              key="bulk-discounts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BulkDiscountsView />
            </motion.div>
          )}
          {activeView === "flash-sales" && (
            <motion.div
              key="flash-sales"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FlashSalesView />
            </motion.div>
          )}
          {activeView === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts();

  const stats = useMemo(() => {
    if (!orders || !products) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => new Date(o.createdAt!) >= today);
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const lowStock = products.filter(p => (p.stock ?? 0) <= 5).length;

    return {
      totalRevenue,
      todayRevenue,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      pendingOrders,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      lowStock,
    };
  }, [orders, products]);

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-white mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats.totalRevenue.toFixed(0)}`} sub={`₹${stats.todayRevenue.toFixed(0)} today`} color="gold-text" />
        <StatCard icon={ShoppingBag} label="Orders" value={stats.totalOrders} sub={`${stats.todayOrders} today`} color="text-blue-400" />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} sub={`${stats.activeProducts} active`} color="text-green-400" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} sub="Items need restock" color="text-orange-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4">Pending Orders</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-4xl font-bold text-yellow-400">{stats.pendingOrders}</p>
              <p className="text-sm text-muted-foreground">Awaiting action</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">
            {orders && orders.length > 0 
              ? `Last order: ${new Date(orders[0].createdAt!).toLocaleDateString()}`
              : "No orders yet"
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: any; sub: string; color: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
    </div>
  );
}

// Products List View
function ProductsListView({ onEdit, onAdd }: { onEdit: (id: number) => void; onAdd: () => void }) {
  const { data: products, isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();
  const [search, setSearch] = useState("");

  const filtered = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <button 
          onClick={onAdd}
          className="gold-button flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
          data-testid="button-add-product"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search products..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none focus:border-primary/50 text-foreground"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin gold-text" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((product) => (
            <div 
              key={product.id} 
              className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4"
              data-testid={`product-row-${product.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-secondary/30 overflow-hidden flex-shrink-0">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="gold-text font-bold">₹{product.price}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      (product.stock ?? 0) > 5 ? 'bg-green-500/20 text-green-400' : 
                      (product.stock ?? 0) > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Stock: {product.stock ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              {/* Action buttons - always visible at bottom */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                <button 
                  onClick={() => onEdit(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-medium"
                  data-testid={`button-edit-${product.id}`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Delete this product?')) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                  data-testid={`button-delete-${product.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Product Edit View - Separate Full Page
function ProductEditView({ productId, onBack }: { productId: number | null; onBack: () => void }) {
  const { data: products } = useProducts();
  const product = productId ? products?.find(p => p.id === productId) : null;
  const isNew = !productId;
  const { toast } = useToast();
  const createMutation = useCreateProduct();
  
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      // objectPath already includes /objects/ prefix
      const imageUrl = response.objectPath.startsWith('/objects/') 
        ? response.objectPath 
        : `/objects/${response.objectPath}`;
      setImages(prev => [...prev, imageUrl]);
      toast({ title: "Image uploaded successfully!" });
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated" });
      onBack();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      costPrice: product?.costPrice || 0,
      stock: product?.stock || 0,
      category: product?.category || "",
      images: product?.images || [],
      isActive: product?.isActive ?? true,
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
    e.target.value = "";
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertProduct) => {
    const payload = { ...data, images };
    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Product created" });
          onBack();
        }
      });
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-3xl text-white">
            {isNew ? "Add Product" : "Edit Product"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Create a new product" : `Editing: ${product?.name}`}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Details */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-lg gold-text">Product Details</h3>
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Name</label>
              <input 
                {...form.register("name")}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                placeholder="Product name"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Description</label>
              <textarea 
                {...form.register("description")}
                rows={4}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 resize-none"
                placeholder="Product description"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Category</label>
              <input 
                {...form.register("category")}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                placeholder="e.g. Floral, Woody, Fresh"
              />
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-lg gold-text">Pricing & Inventory</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Selling Price (₹)</label>
                <input 
                  type="number"
                  {...form.register("price", { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Cost Price (₹)</label>
                <input 
                  type="number"
                  {...form.register("costPrice", { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Stock Quantity</label>
              <input 
                type="number"
                {...form.register("stock", { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-[#050505] rounded-xl border border-white/10">
              <span className="text-sm">Active Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  {...form.register("isActive")}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Images */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-lg gold-text">Product Images</h3>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary/30">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin gold-text" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
              </button>
            </div>

            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* URL Input */}
            <div className="flex gap-2">
              <input 
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="flex-1 px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 text-sm"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-4 py-3 bg-secondary border border-white/10 rounded-xl hover:bg-secondary/80 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full gold-button py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Orders View
function OrdersView() {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Status updated" });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  });

  const sendInvoiceWhatsApp = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/send-invoice`, { credentials: 'include' });
      const data = await res.json();
      if (data.customerWhatsAppUrl) {
        window.open(data.customerWhatsAppUrl, '_blank');
        toast({ title: "Invoice link opened in WhatsApp" });
      }
    } catch (err) {
      toast({ title: "Failed to send invoice", variant: "destructive" });
    }
  };

  const sendInvoiceEmail = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/send-invoice-email`, { 
        method: 'POST',
        credentials: 'include' 
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Invoice sent via email", description: `Sent to ${data.email}` });
      } else {
        toast({ title: data.message || "Failed to send email", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed to send invoice email", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white mb-2">Orders</h1>
        <p className="text-muted-foreground">{orders?.length || 0} total orders</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm gold-text">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status || 'pending')}`}>
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.createdAt!).toLocaleDateString()} • {order.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold gold-text">₹{order.total}</span>
                  <select
                    value={order.status || 'pending'}
                    onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                    className="px-3 py-2 bg-[#050505] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => sendInvoiceWhatsApp(order.id)}
                    className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                    data-testid={`button-send-invoice-whatsapp-${order.id}`}
                    title="Send invoice via WhatsApp"
                  >
                    WhatsApp
                  </button>
                  {order.email && (
                    <button
                      onClick={() => sendInvoiceEmail(order.id)}
                      className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                      data-testid={`button-send-invoice-email-${order.id}`}
                      title="Send invoice via Email"
                    >
                      Email
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete order #${order.orderNumber}? This cannot be undone.`)) {
                        deleteOrderMutation.mutate(order.id);
                      }
                    }}
                    disabled={deleteOrderMutation.isPending}
                    className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    data-testid={`button-delete-order-${order.id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 text-white">{order.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="ml-2 text-white">{order.paymentMethod}</span>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="ml-2 text-white">{order.address}, {order.city}, {order.state} - {order.pincode}</span>
                </div>
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">Items:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(order.items as OrderItem[]).map((item, i) => (
                      <span key={i} className="text-xs px-3 py-1 bg-secondary/50 rounded-full">
                        {item.name} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Coupons View
function CouponsView() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  
  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCoupon) => {
      const res = await apiRequest("POST", "/api/coupons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon created" });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon deleted" });
    }
  });

  const form = useForm<InsertCoupon>({
    resolver: zodResolver(insertCouponSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: null,
      usageLimit: null,
      expiresAt: null,
      isActive: true,
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-white mb-2">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="gold-button flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Add Coupon Form */}
      {showForm && (
        <form 
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Code</label>
              <input 
                {...form.register("code")}
                placeholder="SAVE20"
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 uppercase"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Type</label>
              <select 
                {...form.register("discountType")}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Value</label>
              <input 
                type="number"
                {...form.register("discountValue", { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="gold-button px-6 py-3 rounded-xl text-sm font-bold"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      {!coupons || coupons.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No coupons yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div 
              key={coupon.id}
              className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Percent className="w-5 h-5 gold-text" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg gold-text">{coupon.code}</span>
                  <p className="text-sm text-muted-foreground">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                    {coupon.minOrderValue && coupon.minOrderValue > 0 && ` • Min ₹${coupon.minOrderValue}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${coupon.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
                <button 
                  onClick={() => {
                    if (confirm('Delete this coupon?')) {
                      deleteMutation.mutate(coupon.id);
                    }
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings View
function SettingsView() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile, isUploading: uploadInProgress } = useUpload();
  const [delhiCharge, setDelhiCharge] = useState('0');
  const [otherCharge, setOtherCharge] = useState('45');
  const [upiId, setUpiId] = useState('abhinavyaduvanshi100-1@oksbi');

  const { data: logoSetting, isLoading: logoLoading } = useQuery<{ key: string; value: string } | null>({
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
    }
  });

  // Fetch delivery charges
  const { data: delhiChargeSetting } = useQuery<{ key: string; value: string } | null>({
    queryKey: ['/api/settings', 'delivery_charge_delhi'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/delivery_charge_delhi');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      } catch {
        return null;
      }
    }
  });

  const { data: otherChargeSetting } = useQuery<{ key: string; value: string } | null>({
    queryKey: ['/api/settings', 'delivery_charge_other'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/delivery_charge_other');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      } catch {
        return null;
      }
    }
  });

  const { data: upiSetting } = useQuery<{ key: string; value: string } | null>({
    queryKey: ['/api/settings', 'merchant_upi_id'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/merchant_upi_id');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      } catch {
        return null;
      }
    }
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (delhiChargeSetting?.value) setDelhiCharge(delhiChargeSetting.value);
  }, [delhiChargeSetting]);

  useEffect(() => {
    if (otherChargeSetting?.value) setOtherCharge(otherChargeSetting.value);
  }, [otherChargeSetting]);

  useEffect(() => {
    if (upiSetting?.value) setUpiId(upiSetting.value);
  }, [upiSetting]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({ title: "Settings saved", description: "Setting has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  });

  const handleSaveDeliveryCharges = () => {
    const delhiValue = parseInt(delhiCharge) || 0;
    const otherValue = parseInt(otherCharge) || 0;
    
    saveMutation.mutate({ key: 'delivery_charge_delhi', value: delhiValue.toString() });
    saveMutation.mutate({ key: 'delivery_charge_other', value: otherValue.toString() });
  };

  const handleSaveUpiId = () => {
    if (!upiId.trim()) {
      toast({ title: "Error", description: "Please enter a valid UPI ID", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ key: 'merchant_upi_id', value: upiId.trim() });
  };

  const handleDeleteUpiId = () => {
    if (confirm('Delete UPI ID? Customers won\'t be able to pay via UPI Direct.')) {
      saveMutation.mutate({ key: 'merchant_upi_id', value: '' });
      setUpiId('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'public');
      if (url) {
        saveMutation.mutate({ key: 'logo_url', value: url });
      }
    } catch {
      toast({ title: "Upload failed", description: "Failed to upload logo", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('Remove the logo? The site will use the default text logo.')) {
      saveMutation.mutate({ key: 'logo_url', value: '' });
    }
  };

  const currentLogo = logoSetting?.value || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#F5A623]" />
          Site Settings
        </h2>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Logo</h3>
        <p className="text-sm text-gray-400 mb-6">
          Upload your brand logo. It will appear in the navigation bar across all pages.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Current Logo Preview */}
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500 mb-2">Current Logo</p>
            <div className="w-48 h-24 bg-[#050505] border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
              {logoLoading ? (
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              ) : currentLogo ? (
                <img 
                  src={currentLogo} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  data-testid="img-current-logo"
                />
              ) : (
                <div className="flex items-center gap-2 text-[#F5A623]">
                  <Flame className="w-6 h-6" />
                  <span className="font-serif text-xl font-bold tracking-widest">LUXE</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-logo-upload"
            />
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || uploadInProgress || saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-black font-medium rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50"
                data-testid="button-upload-logo"
              >
                {(isUploading || uploadInProgress || saveMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload New Logo
              </button>

              {currentLogo && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  data-testid="button-remove-logo"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Logo
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Recommended: PNG or SVG with transparent background. Max size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Charges Section */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#F5A623]" />
          Delivery Charges
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Set delivery charges for different locations. These will be applied at checkout.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Delhi Delivery Charge */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Delhi Delivery Charge (₹)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                value={delhiCharge}
                onChange={(e) => setDelhiCharge(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-white focus:border-[#F5A623] focus:outline-none transition-colors"
                placeholder="0"
                data-testid="input-delhi-charge"
              />
            </div>
            <p className="text-xs text-gray-500">Set to 0 for free delivery in Delhi</p>
          </div>

          {/* Other Cities Delivery Charge */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Other Cities Delivery Charge (₹)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                value={otherCharge}
                onChange={(e) => setOtherCharge(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-white focus:border-[#F5A623] focus:outline-none transition-colors"
                placeholder="45"
                data-testid="input-other-charge"
              />
            </div>
            <p className="text-xs text-gray-500">Delivery charge for cities outside Delhi</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSaveDeliveryCharges}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-[#F5A623] text-black font-medium rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50"
            data-testid="button-save-delivery-charges"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Delivery Charges
          </button>
          <span className="text-xs text-gray-500">
            Current: Delhi ₹{delhiChargeSetting?.value || '0'} | Other ₹{otherChargeSetting?.value || '45'}
          </span>
        </div>
      </div>

      {/* UPI ID Section */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#F5A623]" />
          UPI Payment Settings
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Set your UPI ID for receiving payments. Customers will pay to this UPI ID during checkout.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Merchant UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full md:w-96 px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-white focus:border-[#F5A623] focus:outline-none transition-colors"
              placeholder="yourname@upi"
              data-testid="input-upi-id"
            />
            <p className="text-xs text-gray-500">Example: yourname@paytm, yourname@oksbi, yourname@ybl</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveUpiId}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-[#F5A623] text-black font-medium rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50"
              data-testid="button-save-upi"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save UPI ID
            </button>

            {upiSetting?.value && (
              <button
                onClick={handleDeleteUpiId}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                data-testid="button-delete-upi"
              >
                <Trash2 className="w-4 h-4" />
                Delete UPI ID
              </button>
            )}
          </div>

          {upiSetting?.value && (
            <div className="mt-4 p-4 bg-[#050505] border border-green-500/20 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Current Active UPI ID:</p>
              <p className="text-green-400 font-mono">{upiSetting.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reviews View
function ReviewsView() {
  const { toast } = useToast();
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });
  const { data: products } = useProducts();

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/reviews/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({ title: "Review approved!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({ title: "Review deleted" });
    },
  });

  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Product #${productId}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Product Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and approve customer reviews</p>
        </div>
      </div>

      <div className="grid gap-4">
        {reviews?.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
          </div>
        ) : (
          reviews?.map((review) => (
            <div key={review.id} className="neo-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{review.customerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${review.isApproved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Product: <span className="text-foreground">{getProductName(review.productId)}</span>
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-300">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!review.isApproved && (
                    <button
                      onClick={() => approveMutation.mutate(review.id)}
                      disabled={approveMutation.isPending}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      data-testid={`button-approve-review-${review.id}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(review.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    data-testid={`button-delete-review-${review.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Bulk Discounts View
function BulkDiscountsView() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const { data: discounts, isLoading } = useQuery<BulkDiscount[]>({
    queryKey: ['/api/bulk-discounts'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; minQuantity: number; discountPercent: number; isActive: boolean }) => {
      await apiRequest('POST', '/api/bulk-discounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-discounts'] });
      toast({ title: "Bulk discount created!" });
      setIsAdding(false);
      setName('');
      setMinQuantity('');
      setDiscountPercent('');
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/bulk-discounts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-discounts'] });
      toast({ title: "Updated!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/bulk-discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-discounts'] });
      toast({ title: "Bulk discount deleted" });
    },
  });

  const handleCreate = () => {
    if (!name || !minQuantity || !discountPercent) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name,
      minQuantity: parseInt(minQuantity),
      discountPercent: parseFloat(discountPercent),
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Bulk Order Discounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Set quantity-based discounts for customers</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          data-testid="button-add-bulk-discount"
        >
          <Plus className="w-4 h-4" />
          Add Discount
        </button>
      </div>

      {isAdding && (
        <div className="neo-card p-6">
          <h3 className="font-medium mb-4">New Bulk Discount</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Discount Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Buy 5 Get 10% Off"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-bulk-discount-name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Minimum Quantity</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-bulk-discount-quantity"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Discount %</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g., 10"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-bulk-discount-percent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-black font-medium rounded-lg hover:bg-[#d48c1c] transition-colors"
              data-testid="button-save-bulk-discount"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {discounts?.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bulk discounts configured</p>
          </div>
        ) : (
          discounts?.map((discount) => (
            <div key={discount.id} className="neo-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{discount.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Buy <span className="text-[#F5A623] font-medium">{discount.minQuantity}+</span> items → Get <span className="text-green-400 font-medium">{discount.discountPercent}% OFF</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: discount.id, isActive: !discount.isActive })}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      discount.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                    data-testid={`button-toggle-bulk-discount-${discount.id}`}
                  >
                    {discount.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(discount.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    data-testid={`button-delete-bulk-discount-${discount.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Flash Sales View
function FlashSalesView() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: flashSales, isLoading } = useQuery<FlashSale[]>({
    queryKey: ['/api/flash-sales'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; discountPercent?: number; startDate: string; endDate: string; isActive: boolean }) => {
      await apiRequest('POST', '/api/flash-sales', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flash-sales'] });
      toast({ title: "Flash sale created!" });
      setIsAdding(false);
      setTitle('');
      setDescription('');
      setDiscountPercent('');
      setStartDate('');
      setEndDate('');
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/flash-sales/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flash-sales'] });
      toast({ title: "Updated!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/flash-sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flash-sales'] });
      toast({ title: "Flash sale deleted" });
    },
  });

  const handleCreate = () => {
    if (!title || !startDate || !endDate) {
      toast({ title: "Error", description: "Title, start date and end date are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title,
      description: description || undefined,
      discountPercent: discountPercent ? parseFloat(discountPercent) : undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive: true,
    });
  };

  const isActive = (sale: FlashSale) => {
    const now = new Date();
    return sale.isActive && new Date(sale.startDate) <= now && new Date(sale.endDate) >= now;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin gold-text" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Flash Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">Create limited-time sale banners for your homepage</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          data-testid="button-add-flash-sale"
        >
          <Plus className="w-4 h-4" />
          Add Flash Sale
        </button>
      </div>

      {isAdding && (
        <div className="neo-card p-6">
          <h3 className="font-medium mb-4">New Flash Sale</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Sale Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Diwali Flash Sale!"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-flash-sale-title"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Up to 50% off on all candles"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-flash-sale-description"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Discount % (optional)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                data-testid="input-flash-sale-discount"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Start Date *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                  data-testid="input-flash-sale-start"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">End Date *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none"
                  data-testid="input-flash-sale-end"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-black font-medium rounded-lg hover:bg-[#d48c1c] transition-colors"
              data-testid="button-save-flash-sale"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {flashSales?.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No flash sales configured</p>
          </div>
        ) : (
          flashSales?.map((sale) => (
            <div key={sale.id} className={`neo-card p-6 ${isActive(sale) ? 'border-[#F5A623]/50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">{sale.title}</h3>
                    {isActive(sale) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623] animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  {sale.description && (
                    <p className="text-sm text-gray-400 mb-2">{sale.description}</p>
                  )}
                  {sale.discountPercent && (
                    <p className="text-green-400 font-medium mb-2">{sale.discountPercent}% OFF</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(sale.startDate).toLocaleString()} - {new Date(sale.endDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: sale.id, isActive: !sale.isActive })}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      sale.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                    data-testid={`button-toggle-flash-sale-${sale.id}`}
                  >
                    {sale.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(sale.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    data-testid={`button-delete-flash-sale-${sale.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
