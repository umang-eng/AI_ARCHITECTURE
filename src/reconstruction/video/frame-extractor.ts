export class FrameExtractor {
  /**
   * Extract the first frame of a local video file as a Base64 image URL.
   * Runs natively on the browser using HTML5 Video and Canvas.
   */
  public static extractLocalThumb(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        // Seek to 1 second in or first frame
        video.currentTime = 0.5;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to get 2D context"));
            return;
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          
          // Cleanup
          URL.revokeObjectURL(url);
          video.src = "";
          video.load();
          
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Error loading video resource: " + e));
      };
    });
  }
}
