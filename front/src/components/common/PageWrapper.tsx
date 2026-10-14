import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageWrapperProps {
  titleKey: string;
  children?: React.ReactNode;
}

export function PageWrapper({ titleKey, children }: PageWrapperProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t(titleKey)}</h1>
      {children || (
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{t(titleKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("common.empty")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}