"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cn } from "@/lib/utils";
import { ReconstructionJobStatus, MeasurementResult, ThreeDVector3 } from "@/reconstruction/types";
import { useReconstructionStore } from "@/reconstruction/versioning/reconstruction-store";
import { SplatGenerator } from "@/reconstruction/splatting/splat-generator";
import { Ruler, Trash2, Maximize, Play, ZoomIn, Compass } from "lucide-react";

interface ThreeDViewerProps {
  job: ReconstructionJobStatus;
}

export default function ThreeDViewer({ job }: ThreeDViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const showWalls = useReconstructionStore(s => s.showWalls);
  const showFurniture = useReconstructionStore(s => s.showFurniture);
  const showSplat = useReconstructionStore(s => s.showSplat);
  const showCameraPoses = useReconstructionStore(s => s.showCameraPoses);
  const measurements = useReconstructionStore(s => s.measurements);
  const addMeasurement = useReconstructionStore(s => s.addMeasurement);
  const deleteMeasurement = useReconstructionStore(s => s.deleteMeasurement);
  const clearMeasurements = useReconstructionStore(s => s.clearMeasurements);

  const [measurementMode, setMeasurementMode] = useState(false);
  const [firstPoint, setFirstPoint] = useState<THREE.Vector3 | null>(null);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<"orbit" | "first_person">("orbit");

  // Keep references to scene objects for dynamic visibility toggling
  const sceneRef = useRef<THREE.Scene | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const splatPointsRef = useRef<THREE.Points | null>(null);
  const poseGroupRef = useRef<THREE.Group | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0f19"); // sleek dark void
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(20, 15, 20);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // prevent going below floor
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Grid helper representing coordinate plane
    const gridHelper = new THREE.GridHelper(50, 50, "#3f51b5", "#1e293b");
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Groups for layout elements
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    wallGroupRef.current = wallGroup;

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    const poseGroup = new THREE.Group();
    scene.add(poseGroup);
    poseGroupRef.current = poseGroup;

    const measurementGroup = new THREE.Group();
    scene.add(measurementGroup);
    measurementGroupRef.current = measurementGroup;

    // 6. Draw Enclosure Mesh (Floor, Ceiling, Walls)
    const w = job.dimensions?.width || 14.0;
    const h = job.dimensions?.height || 16.0;
    const ch = 9.0; // standard ceiling

    // Floor Mesh
    const floorGeo = new THREE.BoxGeometry(w, 0.2, h);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(w/2, -0.1, h/2);
    wallGroup.add(floorMesh);

    // Ceiling outline / mesh
    const ceilingGeo = new THREE.BoxGeometry(w, 0.2, h);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: "#0f172a", transparent: true, opacity: 0.3 });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.set(w/2, ch + 0.1, h/2);
    wallGroup.add(ceilingMesh);

    // Wall panels
    const t = 0.4; // thickness
    const wallMat = new THREE.MeshStandardMaterial({ color: "#334155", transparent: true, opacity: 0.4, wireframe: false });

    // Left wall
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(t, ch, h), wallMat);
    wallLeft.position.set(0, ch/2, h/2);
    wallGroup.add(wallLeft);

    // Right wall
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(t, ch, h), wallMat);
    wallRight.position.set(w, ch/2, h/2);
    wallGroup.add(wallRight);

    // Front wall
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(w, ch, t), wallMat);
    wallFront.position.set(w/2, ch/2, 0);
    wallGroup.add(wallFront);

    // Back wall
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w, ch, t), wallMat);
    wallBack.position.set(w/2, ch/2, h);
    wallGroup.add(wallBack);

    // 7. Add Mapped Furniture bounding boxes
    const simulatedFurniture = [
      { type: "bed", x: w/2, y: h/3, width: 6.0, height: 6.5, depth: 3.0, color: "#4ade80" },
      { type: "nightstand", x: w/2 - 4, y: h/3, width: 1.8, height: 1.8, depth: 2.0, color: "#facc15" },
      { type: "nightstand", x: w/2 + 4, y: h/3, width: 1.8, height: 1.8, depth: 2.0, color: "#facc15" },
      { type: "wardrobe", x: 2, y: (3 * h)/4, width: 5.0, height: 2.2, depth: 7.0, color: "#a78bfa" },
    ];

    simulatedFurniture.forEach(f => {
      const fGeo = new THREE.BoxGeometry(f.width, f.depth, f.height);
      const fMat = new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.5 });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(f.x, f.depth/2, f.y);
      furnitureGroup.add(fMesh);
      
      // Wireframe overlay for premium CAD look
      const edgeGeo = new THREE.EdgesGeometry(fGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: "#ffffff", linewidth: 1.5 });
      const wire = new THREE.LineSegments(edgeGeo, edgeMat);
      fMesh.add(wire);
    });

    // 8. Load Gaussian Splats Point Cloud (Simulated PLY parsing)
    fetch(job.plyUrl || "")
      .then(res => res.ok ? res.text() : Promise.reject())
      .catch(() => {
        // Generate mock point cloud locally if backend files are missing/pending
        const dummyText = [
          "ply", "format ascii 1.0", "element vertex 300",
          "property float x", "property float y", "property float z",
          "property uchar red", "property uchar green", "property uchar blue",
          "end_header"
        ];
        for (let i = 0; i < 4000; i++) {
          const rx = Math.random() * w;
          const ry = Math.random() * h;
          const rz = Math.random() * ch;
          const red = Math.floor(Math.random() * 255);
          const green = Math.floor(Math.random() * 255);
          const blue = Math.floor(Math.random() * 255);
          dummyText.push(`${rx} ${ry} ${rz} ${red} ${green} ${blue}`);
        }
        return dummyText.join("\n");
      })
      .then(plyText => {
        const splatPoints = SplatGenerator.parsePLY(plyText);
        
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(splatPoints.length * 3);
        const colors = new Float32Array(splatPoints.length * 3);
        
        splatPoints.forEach((pt, index) => {
          positions[index * 3] = pt.x;
          positions[index * 3 + 1] = pt.z; // y-up representation
          positions[index * 3 + 2] = -pt.y;
          
          colors[index * 3] = pt.r;
          colors[index * 3 + 1] = pt.g;
          colors[index * 3 + 2] = pt.b;
        });

        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
          size: 0.15,
          vertexColors: true,
          transparent: true,
          opacity: 0.85
        });

        const points = new THREE.Points(geom, mat);
        // Center rotation map alignment
        points.position.set(0, 0, 0);
        scene.add(points);
        splatPointsRef.current = points;
      });

    // 9. Camera Pose Cones
    job.poses.forEach(p => {
      const coneGeo = new THREE.ConeGeometry(0.4, 0.9, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: "#ef4444" });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(p.tx, p.tz, -p.ty);
      cone.rotation.set((p.rx*Math.PI)/180, (p.ry*Math.PI)/180, (p.rz*Math.PI)/180);
      poseGroup.add(cone);
    });

    // Orbit controls target room center
    controls.target.set(w/2, ch/2, h/2);
    controls.update();

    // 10. Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [job]);

  // Handle layer toggles dynamically
  useEffect(() => {
    if (wallGroupRef.current) wallGroupRef.current.visible = showWalls;
    if (furnitureGroupRef.current) furnitureGroupRef.current.visible = showFurniture;
    if (splatPointsRef.current) splatPointsRef.current.visible = showSplat;
    if (poseGroupRef.current) poseGroupRef.current.visible = showCameraPoses;
  }, [showWalls, showFurniture, showSplat, showCameraPoses]);

  // Render active measurement annotations in 3D scene
  useEffect(() => {
    const group = measurementGroupRef.current;
    if (!group || !sceneRef.current) return;

    // Clear old lines
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    measurements.forEach(m => {
      // Draw line
      const points = [
        new THREE.Vector3(m.startPoint.x, m.startPoint.z, -m.startPoint.y),
        new THREE.Vector3(m.endPoint.x, m.endPoint.z, -m.endPoint.y)
      ];
      
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: "#6366f1", linewidth: 2 });
      const line = new THREE.Line(geom, mat);
      group.add(line);

      // Draw endpoints
      const sphereGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const sphereMat = new THREE.MeshBasicMaterial({ color: "#4f46e5" });
      
      const s1 = new THREE.Mesh(sphereGeo, sphereMat);
      s1.position.copy(points[0]);
      group.add(s1);

      const s2 = new THREE.Mesh(sphereGeo, sphereMat);
      s2.position.copy(points[1]);
      group.add(s2);
    });
  }, [measurements]);

  // Handle Raycasting click for Measurement mode
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode || !mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Intersect wallGroup meshes
    if (wallGroupRef.current) {
      const intersects = raycasterRef.current.intersectObjects(wallGroupRef.current.children);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        
        if (!firstPoint) {
          setFirstPoint(pt.clone());
        } else {
          // Compute distance
          const distance = firstPoint.distanceTo(pt);
          const result: MeasurementResult = {
            id: `m_${Date.now()}`,
            startPoint: { x: firstPoint.x, y: -firstPoint.z, z: firstPoint.y },
            endPoint: { x: pt.x, y: -pt.z, z: pt.y },
            distanceFeet: Number(distance.toFixed(2)),
            timestamp: new Date().toISOString(),
          };
          addMeasurement(result);
          
          // Reset
          setFirstPoint(null);
          setHoverPoint(null);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode || !firstPoint || !mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    if (wallGroupRef.current) {
      const intersects = raycasterRef.current.intersectObjects(wallGroupRef.current.children);
      if (intersects.length > 0) {
        setHoverPoint(intersects[0].point.clone());
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* 3D Render Canvas */}
      <div 
        ref={mountRef} 
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full flex-1 cursor-crosshair"
      />

      {/* Measurement Mode Prompt */}
      {measurementMode && (
        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-indigo-600/90 text-white rounded-xl text-xs font-bold shadow-lg animate-pulse">
          {!firstPoint 
            ? "Click anywhere on the walls/floor to set the START point" 
            : "Click a second point to set the END point of the measurement"}
        </div>
      )}

      {/* Control overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => {
            setMeasurementMode(!measurementMode);
            setFirstPoint(null);
          }}
          className={cn(
            "p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md transition-all",
            measurementMode 
              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
              : "bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-300"
          )}
        >
          <Ruler className="w-4 h-4" />
          <span>{measurementMode ? "Cancel Ruler" : "CAD Ruler"}</span>
        </button>

        <button
          onClick={() => {
            if (cameraRef.current && controlsRef.current) {
              const w = job.dimensions?.width || 14.0;
              const h = job.dimensions?.height || 16.0;
              cameraRef.current.position.set(w/2, 22, h/2);
              controlsRef.current.target.set(w/2, 0, h/2);
              controlsRef.current.update();
            }
          }}
          className="p-3 bg-slate-900/95 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 flex items-center justify-center gap-2 text-xs font-bold"
        >
          <Compass className="w-4 h-4" />
          <span>Top Down View</span>
        </button>
      </div>

      {/* Right annotations sidebar within Canvas */}
      {measurements.length > 0 && (
        <div className="absolute top-4 right-4 z-10 w-60 max-h-[350px] overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CAD Dimensions</span>
            <button 
              onClick={clearMeasurements}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {measurements.map(m => (
              <div key={m.id} className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">{m.distanceFeet} ft</span>
                <button 
                  onClick={() => deleteMeasurement(m.id)}
                  className="text-slate-600 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
