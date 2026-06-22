"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { InteriorDesignResult } from "@/interior/types";
import { useInteriorStore } from "@/interior/versioning/interior-store";
import { useReconstructionStore } from "@/reconstruction/versioning/reconstruction-store";
import { Ruler, Trash2, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreeDInteriorViewerProps {
  design: InteriorDesignResult;
  width: number;
  height: number;
  furniture: Array<{ id: string; type: string; x: number; y: number; width: number; height: number }>;
}

export default function ThreeDInteriorViewer({ design, width, height, furniture }: ThreeDInteriorViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const showWalls = useReconstructionStore(s => s.showWalls);
  const showFurniture = useReconstructionStore(s => s.showFurniture);
  const measurements = useReconstructionStore(s => s.measurements);
  const addMeasurement = useReconstructionStore(s => s.addMeasurement);
  const deleteMeasurement = useReconstructionStore(s => s.deleteMeasurement);
  const clearMeasurements = useReconstructionStore(s => s.clearMeasurements);

  const [measurementMode, setMeasurementMode] = useState(false);
  const [firstPoint, setFirstPoint] = useState<THREE.Vector3 | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const lightGroupRef = useRef<THREE.Group | null>(null);
  const decorGroupRef = useRef<THREE.Group | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight || 500;
    const ch = 9.0; // standard ceiling

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0c0a09"); // dark stone void
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    camera.position.set(width * 1.3, ch * 1.5, height * 1.3);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controlsRef.current = controls;

    // Groups
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    wallGroupRef.current = wallGroup;

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    const lightGroup = new THREE.Group();
    scene.add(lightGroup);
    lightGroupRef.current = lightGroup;

    const decorGroup = new THREE.Group();
    scene.add(decorGroup);
    decorGroupRef.current = decorGroup;

    const measurementGroup = new THREE.Group();
    scene.add(measurementGroup);
    measurementGroupRef.current = measurementGroup;

    // 5. Materials specifications mapping
    const matMap: Record<string, THREE.MeshStandardMaterial> = {};
    design.materialJson.forEach(spec => {
      matMap[spec.element] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.colorHex),
        roughness: spec.roughness,
        metalness: spec.metalness,
      });
    });

    const floorMat = matMap["floor"] || new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5 });
    const wallMat = matMap["walls"] || new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.9 });
    const ceilingMat = matMap["ceiling"] || new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95 });

    // 6. Draw Enclosure
    // Floor
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, height), floorMat);
    floorMesh.position.set(width / 2, -0.1, height / 2);
    floorMesh.receiveShadow = true;
    wallGroup.add(floorMesh);

    // Ceiling
    const ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, height), ceilingMat);
    ceilingMesh.position.set(width / 2, ch + 0.1, height / 2);
    wallGroup.add(ceilingMesh);

    // Walls
    const tw = 0.4;
    // Left
    const wl = new THREE.Mesh(new THREE.BoxGeometry(tw, ch, height), wallMat);
    wl.position.set(0, ch / 2, height / 2);
    wl.receiveShadow = true;
    wl.castShadow = true;
    wallGroup.add(wl);

    // Right
    const wr = new THREE.Mesh(new THREE.BoxGeometry(tw, ch, height), wallMat);
    wr.position.set(width, ch / 2, height / 2);
    wr.receiveShadow = true;
    wr.castShadow = true;
    wallGroup.add(wr);

    // Front
    const wf = new THREE.Mesh(new THREE.BoxGeometry(width, ch, tw), wallMat);
    wf.position.set(width / 2, ch / 2, 0);
    wf.receiveShadow = true;
    wf.castShadow = true;
    wallGroup.add(wf);

    // Back
    const wb = new THREE.Mesh(new THREE.BoxGeometry(width, ch, tw), wallMat);
    wb.position.set(width / 2, ch / 2, height);
    wb.receiveShadow = true;
    wb.castShadow = true;
    wallGroup.add(wb);

    // 7. Draw Furniture with styled colors
    furniture.forEach(f => {
      const fMat = matMap[f.id] || new THREE.MeshStandardMaterial({ color: "#3b82f6", roughness: 0.6 });
      const fMesh = new THREE.Mesh(new THREE.BoxGeometry(f.width, 2.5, f.height), fMat);
      fMesh.position.set(f.x, 1.25, f.y);
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      furnitureGroup.add(fMesh);

      // Frame outline
      const edge = new THREE.EdgesGeometry(fMesh.geometry);
      const wire = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: "#ffffff", opacity: 0.2, transparent: true }));
      fMesh.add(wire);
    });

    // 8. Place Lighting Nodes
    design.lightingJson.forEach(l => {
      const lightColor = new THREE.Color(l.colorHex);
      
      // Ambient scene lighting
      if (l.type === "ambient") {
        const amb = new THREE.AmbientLight(lightColor, 0.4);
        lightGroup.add(amb);

        // Ceiling chandelier node
        const pLight = new THREE.PointLight(lightColor, l.intensity * 1.5, 40);
        pLight.position.set(l.x, l.z, l.y);
        pLight.castShadow = true;
        pLight.shadow.bias = -0.001;
        pLight.shadow.mapSize.width = 1024;
        pLight.shadow.mapSize.height = 1024;
        lightGroup.add(pLight);

        // Visual bulb bulb
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: l.colorHex }));
        bulb.position.set(l.x, l.z, l.y);
        lightGroup.add(bulb);
      } else {
        // Spotlight or bedside point lights
        const spot = new THREE.PointLight(lightColor, l.intensity * 1.2, 20);
        spot.position.set(l.x, l.z, l.y);
        spot.castShadow = true;
        lightGroup.add(spot);

        // Visual lamp
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 0.8), new THREE.MeshBasicMaterial({ color: l.colorHex }));
        lamp.position.set(l.x, l.z, l.y);
        lightGroup.add(lamp);
      }
    });

    // 9. Place Decorations
    design.interiorJson.forEach(dec => {
      if (dec.type === "rug") {
        // Flat thin floor mesh
        const rugGeo = new THREE.BoxGeometry(dec.width, 0.02, dec.height);
        const rugMat = new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.95 });
        const rug = new THREE.Mesh(rugGeo, rugMat);
        rug.position.set(dec.x, 0.01, dec.y);
        rug.receiveShadow = true;
        decorGroup.add(rug);
      } else if (dec.type === "painting") {
        // Frame on wall plane
        const artGeo = new THREE.BoxGeometry(0.1, dec.height, dec.width);
        const artMat = new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.8 });
        const art = new THREE.Mesh(artGeo, artMat);
        art.position.set(dec.x + 0.05, 4.5, dec.y); // hung at 4.5ft height
        art.castShadow = true;
        decorGroup.add(art);
      } else if (dec.type === "plant") {
        // Simple pot and plant cylinder representation
        const potGeo = new THREE.CylinderGeometry(0.5, 0.3, 1.0);
        const potMat = new THREE.MeshStandardMaterial({ color: "#7c2d12", roughness: 0.7 });
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.set(dec.x, 0.5, dec.y);
        pot.castShadow = true;
        decorGroup.add(pot);

        const leafGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.9 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(dec.x, 1.3, dec.y);
        leaf.castShadow = true;
        decorGroup.add(leaf);
      }
    });

    // Orbit target center
    controls.target.set(width / 2, ch / 2, height / 2);
    controls.update();

    // 10. Animation
    let animId: number;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    // Resize
    const onResize = () => {
      if (!mountRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [design, width, height, furniture]);

  // Handle visibility toggles
  useEffect(() => {
    if (wallGroupRef.current) wallGroupRef.current.visible = showWalls;
    if (furnitureGroupRef.current) furnitureGroupRef.current.visible = showFurniture;
  }, [showWalls, showFurniture]);

  // Render measurements in 3D scene
  useEffect(() => {
    const group = measurementGroupRef.current;
    if (!group || !sceneRef.current) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    measurements.forEach(m => {
      const points = [
        new THREE.Vector3(m.startPoint.x, m.startPoint.z, -m.startPoint.y),
        new THREE.Vector3(m.endPoint.x, m.endPoint.z, -m.endPoint.y)
      ];
      
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: "#6366f1", linewidth: 2 });
      const line = new THREE.Line(geom, mat);
      group.add(line);

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

  // Raycast click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode || !mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    if (wallGroupRef.current) {
      const intersects = raycasterRef.current.intersectObjects(wallGroupRef.current.children);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        if (!firstPoint) {
          setFirstPoint(pt.clone());
        } else {
          const distance = firstPoint.distanceTo(pt);
          addMeasurement({
            id: `m_${Date.now()}`,
            startPoint: { x: firstPoint.x, y: -firstPoint.z, z: firstPoint.y },
            endPoint: { x: pt.x, y: -pt.z, z: pt.y },
            distanceFeet: Number(distance.toFixed(2)),
            timestamp: new Date().toISOString(),
          });
          setFirstPoint(null);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-stone-950 rounded-3xl border border-stone-900 overflow-hidden shadow-2xl">
      <div 
        ref={mountRef} 
        onClick={handleCanvasClick}
        className="w-full flex-1 cursor-crosshair"
      />

      {measurementMode && (
        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-indigo-600/90 text-white rounded-xl text-xs font-bold shadow-lg animate-pulse">
          {!firstPoint ? "Select start wall/floor node" : "Select end measurement node"}
        </div>
      )}

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
              : "bg-stone-900/95 hover:bg-stone-800 border border-stone-700 text-stone-300"
          )}
        >
          <Ruler className="w-4 h-4" />
          <span>{measurementMode ? "Cancel Ruler" : "CAD Ruler"}</span>
        </button>

        <button
          onClick={() => {
            if (cameraRef.current && controlsRef.current) {
              cameraRef.current.position.set(width/2, 22, height/2);
              controlsRef.current.target.set(width/2, 0, height/2);
              controlsRef.current.update();
            }
          }}
          className="p-3 bg-stone-900/95 hover:bg-stone-800 border border-stone-700 rounded-xl text-stone-300 flex items-center justify-center gap-2 text-xs font-bold"
        >
          <Compass className="w-4 h-4" />
          <span>Top Down View</span>
        </button>
      </div>

      {measurements.length > 0 && (
        <div className="absolute top-4 right-4 z-10 w-60 max-h-[350px] overflow-y-auto bg-stone-900/95 border border-stone-800 rounded-2xl p-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-850 pb-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Ruler Annotations</span>
            <button onClick={clearMeasurements} className="text-stone-500 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {measurements.map(m => (
              <div key={m.id} className="bg-stone-950 p-2 rounded-xl border border-stone-850 flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-200">{m.distanceFeet} ft</span>
                <button onClick={() => deleteMeasurement(m.id)} className="text-stone-600 hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
