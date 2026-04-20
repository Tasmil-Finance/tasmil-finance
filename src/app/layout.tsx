import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import localFont from "next/font/local";
import { AppProvider } from "@/providers/app-provider";
import "./globals.css";

const outfit = localFont({
  src: "../../public/fonts/PPNeueMontreal.otf",
  variable: "--font-outfit",
  display: "swap",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
    if (isDark) {
      html.setAttribute('data-dark', '');
    } else {
      html.removeAttribute('data-dark');
    }
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export const metadata: Metadata = {
  title: "Tasmil Finance",
  description: "DeFi platform for Stellar ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${outfit.variable}`} lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className={`${outfit.className} antialiased`}>
        <AppProvider>{children}</AppProvider>
        {process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"] && (
          <GoogleAnalytics gaId={process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"]} />
        )}
      </body>
    </html>
  );
}
