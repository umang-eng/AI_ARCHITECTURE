import { VisionAnalysisResult } from "../types";

export class VisionValidator {
  /**
   * Validate that the API response conforms to the VisionAnalysisResult structure.
   */
  public static validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      return { isValid: false, errors: ["Data is not a valid JSON object"] };
    }

    // Check roomType
    if (typeof data.roomType !== "string" || data.roomType.trim() === "") {
      errors.push("Missing or invalid property: roomType must be a non-empty string");
    }

    // Check dimensions
    if (!data.dimensions || typeof data.dimensions !== "object") {
      errors.push("Missing property: dimensions must be an object");
    } else {
      if (typeof data.dimensions.width !== "number" || data.dimensions.width <= 0) {
        errors.push("dimensions.width must be a positive number");
      }
      if (typeof data.dimensions.height !== "number" || data.dimensions.height <= 0) {
        errors.push("dimensions.height must be a positive number");
      }
    }

    // Check furniture
    if (data.furniture !== undefined && !Array.isArray(data.furniture)) {
      errors.push("furniture must be an array of objects");
    } else if (Array.isArray(data.furniture)) {
      data.furniture.forEach((f: any, idx: number) => {
        if (!f || typeof f !== "object") {
          errors.push(`furniture[${idx}] is not an object`);
          return;
        }
        if (typeof f.id !== "string") errors.push(`furniture[${idx}].id must be a string`);
        if (typeof f.type !== "string") errors.push(`furniture[${idx}].type must be a string`);
        if (typeof f.x !== "number") errors.push(`furniture[${idx}].x must be a number`);
        if (typeof f.y !== "number") errors.push(`furniture[${idx}].y must be a number`);
        if (typeof f.width !== "number" || f.width <= 0) errors.push(`furniture[${idx}].width must be a positive number`);
        if (typeof f.height !== "number" || f.height <= 0) errors.push(`furniture[${idx}].height must be a positive number`);
        if (typeof f.rotation !== "number") errors.push(`furniture[${idx}].rotation must be a number`);
      });
    }

    // Check doors
    if (data.doors !== undefined && !Array.isArray(data.doors)) {
      errors.push("doors must be an array of objects");
    } else if (Array.isArray(data.doors)) {
      data.doors.forEach((d: any, idx: number) => {
        if (!d || typeof d !== "object") {
          errors.push(`doors[${idx}] is not an object`);
          return;
        }
        if (typeof d.id !== "string") errors.push(`doors[${idx}].id must be a string`);
        if (typeof d.x !== "number") errors.push(`doors[${idx}].x must be a number`);
        if (typeof d.y !== "number") errors.push(`doors[${idx}].y must be a number`);
        if (typeof d.width !== "number" || d.width <= 0) errors.push(`doors[${idx}].width must be a positive number`);
        if (d.orientation !== "horizontal" && d.orientation !== "vertical") {
          errors.push(`doors[${idx}].orientation must be 'horizontal' or 'vertical'`);
        }
      });
    }

    // Check windows
    if (data.windows !== undefined && !Array.isArray(data.windows)) {
      errors.push("windows must be an array of objects");
    } else if (Array.isArray(data.windows)) {
      data.windows.forEach((w: any, idx: number) => {
        if (!w || typeof w !== "object") {
          errors.push(`windows[${idx}] is not an object`);
          return;
        }
        if (typeof w.id !== "string") errors.push(`windows[${idx}].id must be a string`);
        if (typeof w.x !== "number") errors.push(`windows[${idx}].x must be a number`);
        if (typeof w.y !== "number") errors.push(`windows[${idx}].y must be a number`);
        if (typeof w.width !== "number" || w.width <= 0) errors.push(`windows[${idx}].width must be a positive number`);
        if (w.orientation !== "horizontal" && w.orientation !== "vertical") {
          errors.push(`windows[${idx}].orientation must be 'horizontal' or 'vertical'`);
        }
      });
    }

    // Check rooms (if present, for multi-room walkthroughs)
    if (data.rooms !== undefined && !Array.isArray(data.rooms)) {
      errors.push("rooms must be an array");
    } else if (Array.isArray(data.rooms)) {
      data.rooms.forEach((r: any, idx: number) => {
        if (!r || typeof r !== "object") {
          errors.push(`rooms[${idx}] is not an object`);
          return;
        }
        if (typeof r.id !== "string") errors.push(`rooms[${idx}].id must be a string`);
        if (typeof r.roomType !== "string") errors.push(`rooms[${idx}].roomType must be a string`);
        if (typeof r.x !== "number") errors.push(`rooms[${idx}].x must be a number`);
        if (typeof r.y !== "number") errors.push(`rooms[${idx}].y must be a number`);
        if (!r.dimensions || typeof r.dimensions !== "object") {
          errors.push(`rooms[${idx}].dimensions must be an object`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
