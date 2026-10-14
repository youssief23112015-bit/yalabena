import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
      <p className="text-muted-foreground max-w-sm">
        {t("common.error") || "The page you are looking for does not exist or has been moved."}
      </p>
      <Button onClick={() => navigate("/")} className="mt-2">
        <Home className="h-4 w-4 me-2" /> {t("common.back") || "Go to Dashboard"}
      </Button>
    </div>
  );
}