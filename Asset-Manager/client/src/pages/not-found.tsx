import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto p-8 border border-border bg-card shadow-sm rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-serif text-foreground mb-2">404</h1>
        <p className="text-lg font-medium text-foreground/80 mb-4">Page Not Found</p>
        <p className="text-muted-foreground text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
