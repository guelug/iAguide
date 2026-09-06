import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localeDetection: false,
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
