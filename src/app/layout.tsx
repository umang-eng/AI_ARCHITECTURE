import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import "@excalidraw/excalidraw/index.css";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Architect",
  description: "Modern AI Architect Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth">
      <body className={`${inter.className} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
