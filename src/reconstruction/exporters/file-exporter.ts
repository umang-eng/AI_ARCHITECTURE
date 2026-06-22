export class FileExporter {
  /**
   * Export the room structure and furniture layout to a Wavefront OBJ string.
   */
  public static exportToOBJ(
    width: number,
    height: number,
    ceilingHeight: number,
    furniture: any[]
  ): string {
    const lines: string[] = ["# Wavefront OBJ Export", ""];
    let vCount = 1;

    const addBox = (cx: float, cy: float, cz: float, dx: number, dy: number, dz: number, label: string) => {
      const hx = dx / 2;
      const hy = dy / 2;
      const hz = dz / 2;

      lines.push(`o ${label}`);
      
      // Vertices
      const vertices = [
        [cx - hx, cy - hy, cz - hz],
        [cx + hx, cy - hy, cz - hz],
        [cx + hx, cy + hy, cz - hz],
        [cx - hx, cy + hy, cz - hz],
        [cx - hx, cy - hy, cz + hz],
        [cx + hx, cy - hy, cz + hz],
        [cx + hx, cy + hy, cz + hz],
        [cx - hx, cy + hy, cz + hz],
      ];
      
      for (const v of vertices) {
        lines.push(`v ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}`);
      }

      // Faces
      const faces = [
        [1, 4, 3, 2],
        [5, 6, 7, 8],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 4, 8, 7],
        [4, 1, 5, 8],
      ];
      
      for (const f of faces) {
        lines.push(`f ${f[0] + vCount - 1} ${f[1] + vCount - 1} ${f[2] + vCount - 1} ${f[3] + vCount - 1}`);
      }

      vCount += 8;
      lines.push("");
    };

    // Add Floor & Ceiling
    addBox(width / 2, height / 2, -0.05, width, height, 0.1, "Floor");
    addBox(width / 2, height / 2, ceilingHeight + 0.05, width, height, 0.1, "Ceiling");

    // Add Walls
    const t = 0.4; // Wall thickness
    addBox(-t/2, height/2, ceilingHeight/2, t, height, ceilingHeight, "Wall_Left");
    addBox(width + t/2, height/2, ceilingHeight/2, t, height, ceilingHeight, "Wall_Right");
    addBox(width/2, -t/2, ceilingHeight/2, width, t, ceilingHeight, "Wall_Front");
    addBox(width/2, height + t/2, ceilingHeight/2, width, t, ceilingHeight, "Wall_Back");

    // Add Furniture
    furniture.forEach((f, idx) => {
      addBox(f.x, f.y, 1.25, f.width, f.height, 2.5, `Furniture_${idx}_${f.type}`);
    });

    return lines.join("\n");
  }

  /**
   * Export to ASCII FBX format.
   */
  public static exportToFBX(
    width: number,
    height: number,
    ceilingHeight: number,
    furniture: any[]
  ): string {
    return [
      "; FBX 7.4.0 project export",
      "FBXHeaderExtension: {",
      "  FBXVersion: 7400",
      "}",
      "Definitions: {",
      "  Version: 100",
      "  Count: 1",
      "  ObjectType: \"Model\" {",
      "    Count: 1",
      "  }",
      "}",
      "Objects: {",
      "  Model: 1, \"Model::Room\", \"Null\" {",
      "    Version: 232",
      "    Properties70: {",
      `      P: \"Lcl Scaling\", \"LclScaling\", \"\", \"A\", ${width}, ${height}, ${ceilingHeight}`,
      "    }",
      "  }",
      "}",
      "; End of FBX file"
    ].join("\n");
  }

  /**
   * Export to standard glTF 2.0 structure.
   */
  public static exportToGLTF(
    width: number,
    height: number,
    ceilingHeight: number,
    furniture: any[]
  ): string {
    const gltf = {
      asset: {
        version: "2.0",
        generator: "AI Architect Reconstruction Exporter",
      },
      scenes: [{ nodes: [0] }],
      nodes: [
        {
          name: "Room_Root",
          children: [1, 2],
        },
        {
          name: "Enclosure",
          scale: [width, height, ceilingHeight],
        },
        {
          name: "Furniture_Group",
          children: furniture.map((_, idx) => idx + 3),
        },
        ...furniture.map((f, idx) => ({
          name: `Furniture_${f.type}`,
          translation: [f.x, f.y, 1.25],
          scale: [f.width, f.height, 2.5],
        })),
      ],
    };
    return JSON.stringify(gltf, null, 2);
  }
}
type float = number;
