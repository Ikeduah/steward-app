import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

// Satoshi is the display and body face for the marketing landing page. It is a
// Fontshare release, not a Google font, so it is self-hosted from fonts/satoshi
// under the ITF Free Font License (FFL.txt sits next to the file). One variable
// file covers the whole 300-900 range.
const satoshi = localFont({
  src: "../fonts/satoshi/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <main className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${satoshi.variable} font-sans antialiased`}>
        <Component {...pageProps} />
      </main>
    </ClerkProvider>
  );
}
