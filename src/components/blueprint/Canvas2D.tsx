"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useBlueprintStore } from "@/store/blueprint-store";
import { BlueprintCommand } from "@/blueprint/commands/command";
import { CommandType } from "@/blueprint/commands/command-types";

const FT = 0.3048;
const PX_PER_FT = 8;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

function ft(v: number): number {
  return v * FT;
}

function hexToFill(hex: string): string {
  return "#" + hex.replace("#", "");
}

function clampPan(
  px: number, py: number,
  plotW: number, plotH: number,
  zoom: number, viewW: number, viewH: number,
): { x: number; y: number } {
  const scaledW = plotW * FT * PX_PER_FT * zoom;
  const scaledH = plotH * FT * PX_PER_FT * zoom;

  // How far the center of the plot can move from the center of the viewport
  // while keeping at least 25% of the plot visible on each side
  const maxOffsetX = Math.max(0, (viewW / 2) - (scaledW * 0.25));
  const maxOffsetY = Math.max(0, (viewH / 2) - (scaledH * 0.25));

  return {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, px)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, py)),
  };
}

export default function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const commands = useBlueprintStore((s) => s.blueprintCommands);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef({ active: false, button: 0, x: 0, y: 0 });
  const plotSizeRef = useRef({ w: 60, h: 80 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;
    const scale = PX_PER_FT * zoomRef.current;
    const cx = viewW / 2 + panRef.current.x;
    const cy = viewH / 2 + panRef.current.y;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const toX = (v: number) => ft(v);
    const toY = (v: number) => ft(v);

    for (const cmd of commands) {
      const p = cmd.payload;
      switch (cmd.type) {
        case CommandType.DRAW_PLOT: drawPlot(ctx, p, toX, toY); break;
        case CommandType.DRAW_ROOM: drawRoom(ctx, p, toX, toY); break;
        case CommandType.DRAW_DOOR: drawDoor(ctx, p, toX, toY); break;
        case CommandType.DRAW_WINDOW: drawWindow(ctx, p, toX, toY); break;
        case CommandType.DRAW_TEXT: drawText(ctx, p, toX, toY); break;
        case CommandType.DRAW_DIMENSION: drawDimension(ctx, p, toX, toY); break;
        case CommandType.DRAW_STAIRCASE: drawStairs(ctx, p, toX, toY); break;
        case CommandType.DRAW_NORTH_ARROW: drawNorthArrow(ctx, p, toX, toY); break;
        case CommandType.DRAW_SCALE_INDICATOR: drawScale(ctx, p, toX, toY); break;
        case CommandType.DRAW_AREA_SUMMARY: drawAreaSummary(ctx, p, toX, toY); break;
        case CommandType.DRAW_FURNITURE: drawFurniture(ctx, p, toX, toY); break;
      }
    }

    ctx.restore();
  }, [commands]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
      canvas.style.width = parent.clientWidth + "px";
      canvas.style.height = parent.clientHeight + "px";
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor));
    zoomRef.current = newZoom;

    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;
      panRef.current = clampPan(
        panRef.current.x, panRef.current.y,
        plotSizeRef.current.w, plotSizeRef.current.h,
        newZoom, viewW, viewH,
      );
    }
    draw();
  }, [draw]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { active: true, button: e.button, x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;

    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;
      const raw = { x: panRef.current.x + dx, y: panRef.current.y + dy };
      panRef.current = clampPan(raw.x, raw.y, plotSizeRef.current.w, plotSizeRef.current.h, zoomRef.current, viewW, viewH);
    }
    draw();
  }, [draw]);

  const onMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  useEffect(() => {
    if (!commands.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let plotW = 60;
    let plotH = 80;
    const plotCmd = commands.find((c) => c.type === CommandType.DRAW_PLOT);
    if (plotCmd?.payload) {
      plotW = plotCmd.payload.width || 60;
      plotH = plotCmd.payload.height || 80;
    }
    plotSizeRef.current = { w: plotW, h: plotH };

    const totalFt = Math.max(plotW, plotH);
    const neededPx = totalFt * PX_PER_FT;
    const availW = parent.clientWidth;
    const availH = parent.clientHeight;
    const newZoom = Math.min(availW / neededPx, availH / neededPx) * 0.9;
    zoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    panRef.current = clampPan(0, 0, plotW, plotH, zoomRef.current, availW, availH);
    draw();
  }, [commands, draw]);

  return (
    <canvas
      ref={canvasRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}

function drawPlot(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(0);
  const y = toY(0);
  const w = toX(p.width);
  const h = toY(p.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1e2530";
  ctx.lineWidth = 0.04;
  ctx.strokeRect(x, y, w, h);

  const step = 5;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.005;
  for (let gx = step; gx < p.width; gx += step) {
    ctx.beginPath();
    ctx.moveTo(toX(gx), y);
    ctx.lineTo(toX(gx), y + h);
    ctx.stroke();
  }
  for (let gy = step; gy < p.height; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, toY(gy));
    ctx.lineTo(x + w, toY(gy));
    ctx.stroke();
  }
}

const ROOM_COLORS: Record<string, string> = {
  livingRoom: "#e8f4f8",
  kitchen: "#fef3c7",
  dining: "#fce7f3",
  hallway: "#f1f5f9",
  bedroom: "#ede9fe",
  bathroom: "#dbeafe",
  garage: "#e2e8f0",
  office: "#ecfdf5",
  staircase: "#f8fafc",
  garden: "#d1fae5",
};

function drawRoom(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const w = toX(p.width);
  const h = toY(p.height);
  const color = p.color_hex || ROOM_COLORS[p.roomType] || "#f8fafc";

  ctx.fillStyle = hexToFill(color);
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 0.04;
  ctx.strokeRect(x, y, w, h);

  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const roomName = p.name || p.id || "Room";
  const dimText = `${p.width}' x ${p.height}'`;

  const lineSpacing = Math.min(w, h) * 0.12;
  const startY = centerY - lineSpacing / 2;

  const nameFontSize = Math.min(w, h) * 0.09;
  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${Math.max(0.13, nameFontSize)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(roomName, centerX, startY);

  const dimFontSize = Math.min(w, h) * 0.06;
  ctx.fillStyle = "#6366f1";
  ctx.font = `500 ${Math.max(0.09, dimFontSize)}px sans-serif`;
  ctx.fillText(dimText, centerX, startY + lineSpacing);
}

function drawDoor(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const doorW = toX(p.width || 3);

  ctx.strokeStyle = "#8b4513";
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(x - doorW / 2, y);
  ctx.lineTo(x + doorW / 2, y);
  ctx.stroke();

  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 0.01;
  ctx.setLineDash([0.02, 0.015]);
  ctx.beginPath();
  ctx.arc(x - doorW / 2, y, doorW, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWindow(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const winW = toX(p.width || 4);

  ctx.strokeStyle = "#87ceeb";
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(x - winW / 2, y);
  ctx.lineTo(x + winW / 2, y);
  ctx.stroke();

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 0.01;
  ctx.beginPath();
  ctx.moveTo(x - winW / 2, y - 0.04);
  ctx.lineTo(x - winW / 2, y + 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + winW / 2, y - 0.04);
  ctx.lineTo(x + winW / 2, y + 0.04);
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const size = (p.size || 12) * 0.03;
  const color = p.color || "#0f172a";

  ctx.fillStyle = color;
  ctx.font = `600 ${Math.max(0.08, size)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.text || "", x, y);
}

function drawDimension(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x1 = toX(p.x1);
  const y1 = toY(p.y1);
  const x2 = toX(p.x2);
  const y2 = toY(p.y2);

  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 0.012;
  ctx.setLineDash([0.03, 0.02]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  const tickLen = 0.08;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = -dy / len * tickLen;
  const ny = dx / len * tickLen;

  ctx.beginPath();
  ctx.moveTo(x1 + nx, y1 + ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2 + nx, y2 + ny);
  ctx.lineTo(x2 - nx, y2 - ny);
  ctx.stroke();

  if (p.label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = "#4338ca";
    ctx.font = "600 0.1px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(p.label, midX, midY - 0.05);
  }
}

function drawStairs(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const w = toX(p.width);
  const h = toY(p.height);

  ctx.fillStyle = "#f1f5f9";
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.02;
  ctx.strokeRect(x, y, w, h);

  const isH = p.width >= p.height;
  const count = 6;
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 0.01;

  for (let i = 1; i < count; i++) {
    ctx.beginPath();
    if (isH) {
      const sx = x + (w / count) * i;
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + h);
    } else {
      const sy = y + (h / count) * i;
      ctx.moveTo(x, sy);
      ctx.lineTo(x + w, sy);
    }
    ctx.stroke();
  }

  const arrowX = x + w * 0.4;
  const arrowTop = y + h * 0.2;
  const arrowBot = y + h * 0.85;
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 0.015;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowTop);
  ctx.lineTo(arrowX, arrowBot);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX - 0.06, arrowBot - 0.06);
  ctx.lineTo(arrowX, arrowBot);
  ctx.lineTo(arrowX + 0.06, arrowBot - 0.06);
  ctx.stroke();

  ctx.fillStyle = "#475569";
  ctx.font = "bold 0.12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STAIRS", x + w / 2, y + h / 2);
}

function drawNorthArrow(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const nx = toX(p.x);
  const nz = toY(p.y);
  const sz = toX(p.size || 4);
  const half = sz / 2;

  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(nx, nz + half * 0.3);
  ctx.lineTo(nx, nz - half * 0.8);
  ctx.stroke();

  const aw = sz * 0.12;
  ctx.beginPath();
  ctx.moveTo(nx - aw, nz - half * 0.55);
  ctx.lineTo(nx, nz - half * 0.8);
  ctx.lineTo(nx + aw, nz - half * 0.55);
  ctx.stroke();

  ctx.fillStyle = "#1e2530";
  ctx.font = "bold 0.18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("N", nx, nz + half * 0.35);
}

function drawScale(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const sx = toX(p.x);
  const sz = toY(p.y);
  const len = toX(p.length);
  const tick = 0.08;

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 0.015;
  ctx.beginPath();
  ctx.moveTo(sx, sz);
  ctx.lineTo(sx + len, sz);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, sz - tick);
  ctx.lineTo(sx, sz + tick);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + len, sz - tick);
  ctx.lineTo(sx + len, sz + tick);
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.font = "500 0.1px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${p.length}'`, sx + len / 2, sz + tick + 0.02);
}

function drawAreaSummary(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const w = toX(p.width);
  const h = toY(p.height);

  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.95;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.012;
  ctx.strokeRect(x, y, w, h);

  const lines = [
    { text: "AREA SUMMARY", size: 0.13, color: "#1e1b4b", bold: true },
    { text: `Plot: ${p.plotArea} sq ft`, size: 0.1, color: "#334155", bold: false },
    { text: `Built: ${p.builtArea} sq ft`, size: 0.1, color: "#334155", bold: false },
    { text: `Efficiency: ${p.utilization}%`, size: 0.1, color: "#334155", bold: false },
  ];

  const lh = h / (lines.length + 1);
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.font = `${line.bold ? "bold" : "500"} ${line.size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(line.text, x + w / 2, y + lh * (i + 1));
  });
}

function drawFurniture(ctx: CanvasRenderingContext2D, p: any, toX: (v: number) => number, toY: (v: number) => number) {
  const x = toX(p.x);
  const y = toY(p.y);
  const w = toX(p.width);
  const h = toY(p.height);

  ctx.fillStyle = "rgba(139,139,139,0.35)";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.01;
  ctx.strokeRect(x, y, w, h);

  const label = (p.type || "").replace(/_/g, " ").toUpperCase();
  ctx.fillStyle = "#64748b";
  ctx.font = "500 0.07px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}
