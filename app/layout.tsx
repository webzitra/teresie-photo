import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { getWebzitraContent } from "./lib/webzitra-content";
import { WebzitraEditOverlay } from "./components/WebzitraEditOverlay";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Teresie Photo — svatební a portrétní fotografie",
  description:
    "Terezie Flašková — svatební, párová a portrétní fotografie v Českých Budějovicích a po celé ČR. Zachycuji opravdové emoce a okamžiky, které zůstávají.",
  openGraph: {
    title: "Teresie Photo — svatební a portrétní fotografie",
    description:
      "Svatební, párová a portrétní fotografie. České Budějovice + cestování po celé ČR.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side fetch — overlays WebZítra-edited content on top of
  // translations.cs. Returns null when WEBZITRA_PROJECT_ID isn't set
  // or the API is unreachable, in which case LanguageProvider falls
  // back to the static document.
  const overrideCs = await getWebzitraContent();
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider overrideCs={overrideCs}>{children}</LanguageProvider>
        {/* Edit overlay self-activates only when loaded inside the
            WebZítra editor iframe (?wz_edit=1). Renders nothing on the
            production site. */}
        <WebzitraEditOverlay />
      </body>
    </html>
  );
}
