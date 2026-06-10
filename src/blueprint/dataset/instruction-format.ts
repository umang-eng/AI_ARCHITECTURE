export interface TrainingSample {
  instruction: string;
  input: string;
  output: string;
}

export function createTrainingSample(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  blueprint: any,
): TrainingSample {
  const instruction = `Generate a ${style} ${buildingType} floor plan on a ${plotWidth}x${plotHeight} plot with ${bedrooms} bedrooms and ${bathrooms} bathrooms`;

  return {
    instruction,
    input: "",
    output: JSON.stringify(blueprint),
  };
}

export function samplesToJsonl(samples: TrainingSample[]): string {
  return samples.map((s) => JSON.stringify(s)).join("\n");
}

export function downloadTrainingData(samples: TrainingSample[], filename: string) {
  const jsonl = samplesToJsonl(samples);
  const blob = new Blob([jsonl], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
