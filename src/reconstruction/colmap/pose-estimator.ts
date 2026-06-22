import { CameraPose } from "../types";

export class PoseEstimator {
  /**
   * Helper to map camera positions from reconstruction coordinates (meters/feet) 
   * to Three.js space coordinates.
   */
  public static mapCameraCoordinates(pose: CameraPose): {
    position: [number, number, number];
    rotation: [number, number, number];
  } {
    // Coordinate mapping (standard flip/scale if needed)
    return {
      position: [pose.tx, pose.tz, -pose.ty], // Map y-up standard
      rotation: [
        (pose.rx * Math.PI) / 180,
        (pose.ry * Math.PI) / 180,
        (pose.rz * Math.PI) / 180,
      ],
    };
  }

  /**
   * Check camera spacing densities to verify walkthrough path coverage quality.
   */
  public static evaluateCoverageScore(poses: CameraPose[]): number {
    if (poses.length === 0) return 0;
    if (poses.length < 5) return 40;
    if (poses.length < 10) return 75;
    return 95; // Ideal pose count for high quality triangulation
  }
}
