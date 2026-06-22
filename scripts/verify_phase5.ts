import { SpatialAnalyzer } from "../src/reconstruction/analyzers/spatial-analyzer";
import { MeshGenerator } from "../src/reconstruction/meshing/mesh-generator";
import { FileExporter } from "../src/reconstruction/exporters/file-exporter";

function testPhase5() {
  console.log("--- STARTING PHASE 5 3D HOUSE RECONSTRUCTION ENGINE INTEGRATION TEST ---");

  // Sample room details
  const roomWidth = 14.0;
  const roomHeight = 16.0;
  const ceilingHeight = 9.0;
  const dummyFurniture = [
    { type: "bed", x: 7.0, y: 4.0, width: 6.0, height: 6.5 },
    { type: "wardrobe", x: 2.0, y: 12.0, width: 5.0, height: 2.2 }
  ];

  console.log("Step 1: Calculating spatial metrics and diagnostics...");
  const diagnostics = SpatialAnalyzer.calculateDiagnostics(roomWidth, roomHeight, ceilingHeight);
  console.log("Reconstructed Spatial Diagnostics:");
  console.log(` - Floor Area: ${diagnostics.floorAreaSqFt} sq ft`);
  console.log(` - Wall Area: ${diagnostics.wallAreaSqFt} sq ft`);
  console.log(` - Total Volume: ${diagnostics.volumeCuFt} cu ft`);
  console.log(` - Aspect Ratio: ${diagnostics.aspectRatio}`);
  console.log(` - Orthogonality score: ${diagnostics.orthogonalityScore}%`);

  if (diagnostics.floorAreaSqFt !== 224.0) {
    throw new Error(`Area calculation discrepancy: expected 224.0, got ${diagnostics.floorAreaSqFt}`);
  }

  console.log("Step 2: Synthesizing room mesh coordinates and indexes...");
  const meshData = MeshGenerator.generateRoomBox(roomWidth, roomHeight, ceilingHeight);
  console.log(` - Floor Vertices count: ${meshData.floor.vertices.length / 3}`);
  console.log(` - Ceiling Vertices count: ${meshData.ceiling.vertices.length / 3}`);
  console.log(` - Walls Vertices count: ${meshData.walls.vertices.length / 3}`);

  console.log("Step 3: Exporting 3D geometries to standard formats...");
  
  const objData = FileExporter.exportToOBJ(roomWidth, roomHeight, ceilingHeight, dummyFurniture);
  console.log(` - Generated Wavefront OBJ Mesh file size: ${objData.length} characters`);
  if (!objData.includes("o Floor") || !objData.includes("o Wall_Left")) {
    throw new Error("Exported OBJ mesh lacks essential structural nodes!");
  }

  const fbxData = FileExporter.exportToFBX(roomWidth, roomHeight, ceilingHeight, dummyFurniture);
  console.log(` - Generated Autodesk FBX file size: ${fbxData.length} characters`);
  if (!fbxData.includes("Null") || !fbxData.includes("FBXHeaderExtension")) {
    throw new Error("Exported FBX model lacks FBX header structures!");
  }

  const gltfData = FileExporter.exportToGLTF(roomWidth, roomHeight, ceilingHeight, dummyFurniture);
  console.log(` - Generated glTF Asset file size: ${gltfData.length} characters`);
  if (!gltfData.includes("asset") || !gltfData.includes("Room_Root")) {
    throw new Error("Exported glTF model lacks asset metadata or root nodes!");
  }

  console.log("--- PHASE 5 3D HOUSE RECONSTRUCTION ENGINE INTEGRATION TEST SUCCESSFUL ---");
}

testPhase5();
