import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-16 w-16 text-muted-foreground opacity-40" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate("/dashboard")}>
        <Home className="h-4 w-4 mr-2" /> Go to Dashboard
      </Button>
    </div>
  );
}
