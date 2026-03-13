import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Агент прибирання",
  description: "Опишіть забруднення — підберемо товари",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" data-theme="light" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-screen flex flex-col p-0`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
