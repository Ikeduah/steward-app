import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <main className={`${inter.variable} font-sans antialiased`}>
        <Component {...pageProps} />
      </main>
    </ClerkProvider>
  );
}

