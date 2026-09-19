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
      <h1 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
      {children || (
        <Card>
          <CardHeader>
            <CardTitle>{t(titleKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("common.empty")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
