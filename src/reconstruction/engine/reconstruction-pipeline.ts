import { ReconstructionJobStatus } from "../types";

export class ReconstructionPipeline {
  /**
   * Post video media file to the reconstruction server.
   */
  public static async startReconstruction(
    file: File,
    roomTypeHint?: string
  ): Promise<ReconstructionJobStatus> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    const formData = new FormData();
    formData.append("file", file);
    if (roomTypeHint) {
      formData.append("roomTypeHint", roomTypeHint);
    }

    console.log(`[ReconstructionPipeline] Uploading walkthrough video ${file.name} to ${apiBase}/api/v1/reconstruction/upload`);
    
    const response = await fetch(`${apiBase}/api/v1/reconstruction/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Reconstruction failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data as ReconstructionJobStatus;
  }
}
