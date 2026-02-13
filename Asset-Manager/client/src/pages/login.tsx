import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Loader2, Flame, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (user) {
    setLocation("/admin");
    return null;
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/admin");
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="neo-card p-10 rounded-xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <Flame className="h-12 w-12 gold-text" />
              <div className="absolute inset-0 blur-xl bg-primary/30" />
            </div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-2">Enter your credentials to continue</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("username")}
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="admin"
                  data-testid="input-username"
                />
              </div>
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("password")}
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="gold-button w-full py-4 rounded-lg font-semibold uppercase tracking-wider text-sm disabled:opacity-50"
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:gold-text transition-colors">
              Back to Store
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
