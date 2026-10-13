import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";
import enHr from "@/locales/en/hr.json";
import arHr from "@/locales/ar/hr.json";
import enInv from "@/locales/en/inventory.json";
import arInv from "@/locales/ar/inventory.json";

const resources = {
  en: { common: en, hr: enHr, inventory: enInv },
  ar: { common: ar, hr: arHr, inventory: arInv },
};

function applyDirection(language: string) {
  const isArabic = language.startsWith("ar");
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.documentElement.lang = isArabic ? "ar" : "en";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    lng: localStorage.getItem("i18nextLng") || "en",
    ns: ["common", "hr", "inventory"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

applyDirection(i18n.language);
i18n.on("languageChanged", applyDirection);

export default i18n;
