import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <AlertCircle className="mx-auto text-destructive" size={48} />
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link href="/">
          <Button><Home size={16} className="mr-2" /> Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
