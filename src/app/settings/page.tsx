"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { motion } from "framer-motion";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Globe,
  Coins,
  Sun,
  Save,
  Check,
  Loader2,
  Camera,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1500);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Settings"
        description="Manage your account profile and application preferences."
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl space-y-8 pb-24"
      >
        {/* Section 1: Profile */}
        <motion.div variants={itemVariants}>
          <Card title="Account Profile" description="Update your personal details and identity" className="border-none shadow-premium">
            <div className="mt-8 space-y-8">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center text-3xl font-black text-primary border-4 border-white shadow-premium transition-transform group-hover:scale-105 duration-500">
                    UA
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-white shadow-premium border border-border/40 text-primary hover:bg-primary hover:text-white transition-all">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold tracking-tight">Umang Agrawal</h4>
                  <p className="text-sm text-muted-foreground font-medium">Lead Architectural Designer</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Legal Name</label>
                  <input 
                    type="text" 
                    defaultValue="Umang Agrawal" 
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email Identifier</label>
                  <input 
                    type="email" 
                    defaultValue="umang@aiarchitect.com" 
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 2: Application Preferences */}
        <motion.div variants={itemVariants}>
          <Card title="System Workspace" description="Configure your global design environment" className="border-none shadow-premium">
            <div className="mt-8 space-y-10">
              {/* Units */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-sidebar-background group-hover:bg-primary/5 transition-colors">
                    <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Metric System</p>
                    <p className="text-xs text-muted-foreground font-medium">Primary units for all calculations</p>
                  </div>
                </div>
                <div className="flex p-1.5 bg-sidebar-background rounded-2xl border border-border/20">
                  {["Feet", "Meter"].map((unit) => (
                    <button
                      key={unit}
                      className={cn(
                        "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        unit === "Feet" ? "bg-white text-foreground shadow-premium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-sidebar-background group-hover:bg-primary/5 transition-colors">
                    <Coins className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Cost Engine Currency</p>
                    <p className="text-xs text-muted-foreground font-medium">Applied to real-time estimations</p>
                  </div>
                </div>
                <select className="bg-sidebar-background border-none rounded-2xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer">
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-sidebar-background group-hover:bg-primary/5 transition-colors">
                    <Sun className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Visual Interface</p>
                    <p className="text-xs text-muted-foreground font-medium">Dynamic UI theme preference</p>
                  </div>
                </div>
                <div className="px-5 py-2.5 bg-sidebar-background rounded-2xl text-[10px] font-black text-primary uppercase tracking-[0.2em] italic border border-primary/10">
                  Light Only
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 3: Notifications */}
        <motion.div variants={itemVariants}>
          <Card title="Neural Alerts" description="Intelligent notification protocols" className="border-none shadow-premium">
            <div className="mt-8 space-y-6">
              {[
                { label: "Processing Success", desc: "Alerts when AI finishes blueprint synthesis", checked: true },
                { label: "Market Insights", desc: "Updates on construction material pricing", checked: false },
                { label: "Security Protocol", desc: "Immediate notices regarding account integrity", checked: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 group cursor-pointer">
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                  <button className={cn(
                    "w-12 h-7 rounded-full transition-all relative",
                    item.checked ? "bg-primary shadow-lg" : "bg-sidebar-background"
                  )}>
                    <motion.div 
                      animate={{ x: item.checked ? 22 : 4 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm" 
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex justify-end pt-8">
          <PrimaryButton 
            className={cn(
              "h-16 px-12 transition-all gap-3 text-lg font-bold shadow-premium",
              saved && "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
            )}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-6 h-6" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "Syncing..." : saved ? "System Updated" : "Save Changes"}
          </PrimaryButton>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
