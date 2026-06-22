"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useReconstructionStore } from "@/reconstruction/versioning/reconstruction-store";
import { ReconstructionPipeline } from "@/reconstruction/engine/reconstruction-pipeline";
import { SpatialAnalyzer } from "@/reconstruction/analyzers/spatial-analyzer";
import { FileExporter } from "@/reconstruction/exporters/file-exporter";
import { ReconstructionHistory } from "@/reconstruction/history/reconstruction-history";
import { FrameExtractor } from "@/reconstruction/video/frame-extractor";
import { ReconstructionJobStatus } from "@/reconstruction/types";
import { 
  Video, Box, Ruler, Layout, Eye, Play, ArrowLeft, Download, 
  RotateCcw, AlertCircle, Settings2, HelpCircle, Layers, CheckCircle
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ThreeDViewer = dynamic(
  () => import("@/components/reconstruction/ThreeDViewer"),
  { ssr: false }
);

export default function ReconstructionPage() {
  const store = useReconstructionStore();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [localThumb, setLocalThumb] = useState<string | null>(null);
  const [roomHint, setRoomHint] = useState("bedroom");
  const [historyList, setHistoryList] = useState<ReconstructionJobStatus[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize history
  useEffect(() => {
    setHistoryList(ReconstructionHistory.getJobs());
  }, []);

  const handleUploadClick = () => {
    document.getElementById("video-picker")?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);

    // Extract first frame client-side for visual progress preview
    try {
      const thumb = await FrameExtractor.extractLocalThumb(file);
      setLocalThumb(thumb);
    } catch {
      setLocalThumb(null);
    }

    // Trigger Reconstruction pipeline
    store.setProcessing(true);
    store.setError(null);
    try {
      const job = await ReconstructionPipeline.startReconstruction(file, roomHint);
      store.setActiveJob(job);
      ReconstructionHistory.saveJob(job);
      setHistoryList(ReconstructionHistory.getJobs());
    } catch (err: any) {
      store.setError(err.message || "Failed to process 3D reconstruction");
    } finally {
      store.setProcessing(false);
    }
  };

  const handleDownload = (format: "glb" | "fbx" | "obj" | "usdz") => {
    const job = store.activeJob;
    if (!job) return;

    // Use simulated furniture layout
    const dummyFurniture = [
      { type: "bed", x: 7.0, y: 4.0, width: 6.0, height: 6.5 },
      { type: "wardrobe", x: 2.0, y: 12.0, width: 5.0, height: 2.2 }
    ];

    let content = "";
    let mimeType = "text/plain";
    let filename = `reconstruction_${job.jobId}`;

    if (format === "obj") {
      content = FileExporter.exportToOBJ(job.dimensions.width, job.dimensions.height, 9.0, dummyFurniture);
      mimeType = "model/obj";
      filename += ".obj";
    } else if (format === "fbx") {
      content = FileExporter.exportToFBX(job.dimensions.width, job.dimensions.height, 9.0, dummyFurniture);
      mimeType = "application/octet-stream";
      filename += ".fbx";
    } else if (format === "glb") {
      content = FileExporter.exportToGLTF(job.dimensions.width, job.dimensions.height, 9.0, dummyFurniture);
      mimeType = "model/gltf+json";
      filename += ".gltf"; // exported as gLTF JSON fallback structure
    } else {
      content = "USDZ Representation";
      mimeType = "application/octet-stream";
      filename += ".usdz";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadHistoryJob = (job: ReconstructionJobStatus) => {
    store.setActiveJob(job);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#070b13] flex flex-col text-slate-200 font-sans">
      
      {/* Header bar */}
      <header className="h-16 shrink-0 border-b border-slate-900 bg-slate-950/70 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/blueprint" className="p-2 hover:bg-slate-900 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-500" />
              <span>3D Reconstruction Digital-Twin Platform</span>
            </h1>
            <p className="text-[10px] text-slate-500">Transform media streams into interactive CAD elements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {store.activeJob && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" /> Job Completed
            </span>
          )}
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* Left Side: Upload dropzone or 3D Viewer */}
        <div className="flex-1 min-w-0 p-6 flex flex-col gap-6 relative">
          
          {/* Main Visual Content */}
          <div className="flex-1 min-h-0 relative">
            {!store.activeJob && !store.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6 bg-slate-950/50 border border-slate-900 rounded-3xl p-8 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-md">
                    <Video className="w-8 h-8 text-indigo-500" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">Reconstruct 3D Digital Twin</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Upload your walkthrough video, room scanning sequences, or property clips to compile Gaussian Splat models.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={roomHint}
                      onChange={(e) => setRoomHint(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-300"
                    >
                      <option value="bedroom">Bedroom Walkthrough</option>
                      <option value="living_room">Living Room Walkthrough</option>
                      <option value="bathroom">Bathroom Scan</option>
                    </select>

                    <button
                      onClick={handleUploadClick}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Choose Video File</span>
                    </button>
                    <input
                      type="file"
                      id="video-picker"
                      accept="video/*,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spinner Progress view */}
            {store.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm rounded-3xl border border-slate-900 z-10">
                <div className="text-center space-y-4">
                  {localThumb ? (
                    <div className="relative w-48 h-28 rounded-2xl border border-slate-800 overflow-hidden mx-auto shadow-md">
                      <img src={localThumb} alt="Video preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/25 border-t-indigo-500 animate-spin" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
                  )}
                  <h4 className="font-bold text-sm text-slate-200">Reconstructing Room Space...</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Running camera tracking SfM & Poisson triangulation</p>
                </div>
              </div>
            )}

            {/* 3D Scene Viewer */}
            {store.activeJob && !store.isProcessing && (
              <ThreeDViewer job={store.activeJob} />
            )}
          </div>
        </div>

        {/* Right Side: Diagnostics Panel */}
        <aside className="w-80 border-l border-slate-900 bg-slate-950/40 backdrop-blur z-10 flex flex-col">
          <div className="p-5 border-b border-slate-900">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Diagnostics Controls</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Visual Filters */}
            <div className="space-y-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-500" /> Layer Visibility
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-900 cursor-pointer">
                  <span>Splat Point Cloud</span>
                  <input
                    type="checkbox"
                    checked={store.showSplat}
                    onChange={(e) => store.setLayerToggle("showSplat", e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-900 cursor-pointer">
                  <span>Room Mesh Walls</span>
                  <input
                    type="checkbox"
                    checked={store.showWalls}
                    onChange={(e) => store.setLayerToggle("showWalls", e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-900 cursor-pointer">
                  <span>Furniture Boxes</span>
                  <input
                    type="checkbox"
                    checked={store.showFurniture}
                    onChange={(e) => store.setLayerToggle("showFurniture", e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-900 cursor-pointer">
                  <span>Camera Poses</span>
                  <input
                    type="checkbox"
                    checked={store.showCameraPoses}
                    onChange={(e) => store.setLayerToggle("showCameraPoses", e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
              </div>
            </div>

            {/* Model Exporters */}
            {store.activeJob && (
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Download className="w-3 h-3 text-indigo-500" /> Exporters
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button onClick={() => handleDownload("obj")} className="py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-bold transition-all">
                    OBJ Mesh
                  </button>
                  <button onClick={() => handleDownload("glb")} className="py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-bold transition-all">
                    GLB Asset
                  </button>
                  <button onClick={() => handleDownload("fbx")} className="py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-bold transition-all">
                    FBX Model
                  </button>
                  <button onClick={() => handleDownload("usdz")} className="py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-bold transition-all">
                    USDZ AR
                  </button>
                </div>
              </div>
            )}

            {/* Spatial Metrics */}
            {store.activeJob?.diagnostics && (
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Ruler className="w-3 h-3 text-indigo-500" /> Mesh Diagnostics
                </span>
                <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Floor Surface:</span>
                    <span className="font-bold">{store.activeJob.diagnostics.floorAreaSqFt} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wall Surface:</span>
                    <span className="font-bold">{store.activeJob.diagnostics.wallAreaSqFt} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume:</span>
                    <span className="font-bold">{store.activeJob.diagnostics.volumeCuFt} cu ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orthogonality:</span>
                    <span className="font-bold text-emerald-500">{store.activeJob.diagnostics.orthogonalityScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* History logs */}
            {historyList.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3 text-indigo-500" /> Digital Twin Runs
                </span>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {historyList.map(h => (
                    <button
                      key={h.jobId}
                      onClick={() => reloadHistoryJob(h)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all",
                        store.activeJob?.jobId === h.jobId
                          ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400"
                          : "bg-slate-900/50 border-slate-900 hover:bg-slate-900 text-slate-400"
                      )}
                    >
                      <span className="font-bold capitalize">{h.roomType}</span>
                      <span className="text-[9px] text-slate-500">{h.jobId.replace("job_", "")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
