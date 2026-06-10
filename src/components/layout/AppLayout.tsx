import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <Sidebar />
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
}
