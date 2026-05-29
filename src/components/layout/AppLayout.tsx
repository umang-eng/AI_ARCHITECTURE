import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <Sidebar />
      <main className="flex-1 lg:ml-[260px] min-h-screen flex flex-col transition-all duration-300 ease-in-out">
        <div className="flex-1 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
