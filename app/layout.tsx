import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
