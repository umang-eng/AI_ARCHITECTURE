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
    const matMap: Record<string, THREE.Material> = {};
    design.materialJson.forEach(spec => {
      matMap[spec.element] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.colorHex),
        roughness: spec.roughness,
        metalness: spec.metalness,
      });
    });

    const floorMat = matMap["floor"] || new THREE.MeshStandardMaterial({ color: "#e6e8eb", roughness: 0.5 });
    const wallMat = matMap["walls"] || new THREE.MeshStandardMaterial({ color: "#f7f9fb", roughness: 0.92 });
    const ceilingMat = matMap["ceiling"] || new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.96 });

    // Add default scene lighting so the room is vibrant even with no design lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888899, 0.75);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(width * 1.5, ch * 2.5, height * 1.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    scene.add(dirLight);

    // 6. Draw Enclosure
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, height), floorMat);
    floorMesh.position.set(width / 2, -0.1, height / 2);
    floorMesh.receiveShadow = true;
    wallGroup.add(floorMesh);

    const ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, height), ceilingMat);
    ceilingMesh.position.set(width / 2, ch + 0.1, height / 2);
    wallGroup.add(ceilingMesh);

    const tw = 0.35;
    const wallOptions = [
      { geom: new THREE.BoxGeometry(tw, ch, height), pos: [0, ch / 2, height / 2] },
      { geom: new THREE.BoxGeometry(tw, ch, height), pos: [width, ch / 2, height / 2] },
      { geom: new THREE.BoxGeometry(width, ch, tw), pos: [width / 2, ch / 2, 0] },
      { geom: new THREE.BoxGeometry(width, ch, tw), pos: [width / 2, ch / 2, height] },
    ];

    wallOptions.forEach(opts => {
      const wall = new THREE.Mesh(opts.geom, wallMat);
      wall.position.set(...opts.pos);
      wall.receiveShadow = true;
      wall.castShadow = true;
      wallGroup.add(wall);
    });

    // 7. Draw Furniture with more natural forms
    furniture.forEach(f => {
      const material = matMap[f.id] || new THREE.MeshStandardMaterial({ color: "#4f46e5", roughness: 0.55, metalness: 0.1 });
      let mesh: THREE.Mesh;

      if (f.type === "bed") {
        const base = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.8, f.height), material);
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(f.width - 0.2, 0.4, f.height - 0.2), new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.7 }));
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(f.width, 1.2, 0.2), new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.6 }));
        base.add(mattress);
        base.add(headboard);
        mattress.position.set(0, 0.6, 0);
        headboard.position.set(0, 0.3, -(f.height / 2) + 0.1);
        mesh = base;
      } else if (f.type === "sofa") {
        const sofaGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(f.width, 1.2, f.height / 2), material);
        const back = new THREE.Mesh(new THREE.BoxGeometry(f.width, 1.0, 0.3), new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.65 }));
        const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, f.height / 2), new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.65 }));
        const armRight = armLeft.clone();
        sofaGroup.add(seat, back, armLeft, armRight);
        seat.position.set(0, 0.6, 0);
        back.position.set(0, 0.95, -(f.height / 4) + 0.05);
        armLeft.position.set(-(f.width / 2) + 0.3, 0.55, 0);
        armRight.position.set((f.width / 2) - 0.3, 0.55, 0);
        mesh = sofaGroup as unknown as THREE.Mesh;
      } else if (f.type === "dining_table" || f.type === "table" || f.type === "desk") {
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.2, f.height), material);
        const legMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.6 });
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), legMat);
        const leg2 = leg1.clone();
        const leg3 = leg1.clone();
        const leg4 = leg1.clone();
        const table = new THREE.Group();
        table.add(tableTop, leg1, leg2, leg3, leg4);
        tableTop.position.set(0, 0.9, 0);
        leg1.position.set(-(f.width / 2) + 0.3, 0.45, -(f.height / 2) + 0.3);
        leg2.position.set((f.width / 2) - 0.3, 0.45, -(f.height / 2) + 0.3);
        leg3.position.set(-(f.width / 2) + 0.3, 0.45, (f.height / 2) - 0.3);
        leg4.position.set((f.width / 2) - 0.3, 0.45, (f.height / 2) - 0.3);
        mesh = table as unknown as THREE.Mesh;
      } else if (f.type === "bathtub") {
        const tub = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.9, f.height), new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.35, metalness: 0.05 }));
        mesh = tub;
      } else if (f.type === "wardrobe" || f.type === "bookshelf" || f.type === "cabinet") {
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(f.width, 2.2, f.height), new THREE.MeshStandardMaterial({ color: "#7c3aed", roughness: 0.7, metalness: 0.05 }));
        mesh = cabinet;
      } else if (f.type === "chair") {
        const chair = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), material);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.2), new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.72 }));
        const legGeo = new THREE.BoxGeometry(0.15, 1.0, 0.15);
        const legMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 });
        const legs = [new THREE.Mesh(legGeo, legMat), new THREE.Mesh(legGeo, legMat), new THREE.Mesh(legGeo, legMat), new THREE.Mesh(legGeo, legMat)];
        legs.forEach((leg, idx) => {
          leg.position.set((idx < 2 ? -0.7 : 0.7), 0.45, (idx % 2 === 0 ? -0.7 : 0.7));
          chair.add(leg);
        });
        chair.add(seat, back);
        seat.position.set(0, 0.55, 0);
        back.position.set(0, 1.05, -0.7);
        mesh = chair as unknown as THREE.Mesh;
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(f.width, 1.6, f.height), material);
      }

      mesh.position.set(f.x, 0, f.y);
      if (typeof f.rotation === "number" && mesh.rotation) {
        mesh.rotation.y = THREE.MathUtils.degToRad(f.rotation);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      furnitureGroup.add(mesh);
    });

    // 8. Place Lighting Nodes
    design.lightingJson.forEach(l => {
      const lightColor = new THREE.Color(l.colorHex);
      if (l.type === "ambient") {
        const amb = new THREE.AmbientLight(lightColor, 0.35);
        lightGroup.add(amb);
      }

      const pLight = new THREE.PointLight(lightColor, l.intensity * 1.2, 40, 2);
      pLight.position.set(l.x, l.z, l.y);
      pLight.castShadow = true;
      pLight.shadow.bias = -0.001;
      pLight.shadow.mapSize.width = 1024;
      pLight.shadow.mapSize.height = 1024;
      lightGroup.add(pLight);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshBasicMaterial({ color: l.colorHex })
      );
      bulb.position.set(l.x, l.z, l.y);
      lightGroup.add(bulb);
    });

    // 9. Place Decorations
    design.interiorJson.forEach(dec => {
      if (dec.type === "rug") {
        const rugGeo = new THREE.BoxGeometry(dec.width, 0.02, dec.height);
        const rugMat = new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.91 });
        const rug = new THREE.Mesh(rugGeo, rugMat);
        rug.position.set(dec.x, 0.01, dec.y);
        rug.receiveShadow = true;
        decorGroup.add(rug);
      } else if (dec.type === "painting") {
        const artGeo = new THREE.PlaneGeometry(dec.width, dec.height);
        const artMat = new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.8, side: THREE.DoubleSide });
        const art = new THREE.Mesh(artGeo, artMat);
        art.position.set(dec.x + 0.05, 4.5, dec.y);
        art.rotation.y = Math.PI / 2;
        art.castShadow = true;
        decorGroup.add(art);
      } else if (dec.type === "plant") {
        const potGeo = new THREE.CylinderGeometry(0.4, 0.55, 0.9, 12);
        const potMat = new THREE.MeshStandardMaterial({ color: "#92400e", roughness: 0.72 });
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.set(dec.x, 0.45, dec.y);
        pot.castShadow = true;
        decorGroup.add(pot);

        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 10, 10),
          new THREE.MeshStandardMaterial({ color: dec.colorHex, roughness: 0.85 })
        );
        leaves.position.set(dec.x, 1.4, dec.y);
        leaves.castShadow = true;
        decorGroup.add(leaves);
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
