import { Blueprint } from "../types/blueprint";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSample {
  messages: ChatMessage[];
}

export function createChatSample(
  instruction: string,
  blueprint: Blueprint,
): ChatSample {
  return {
    messages: [
      {
        role: "user",
        content: instruction,
      },
      {
        role: "assistant",
        content: JSON.stringify(blueprint),
      },
    ],
  };
}

export function chatSamplesToJsonl(samples: ChatSample[]): string {
  return samples.map((s) => JSON.stringify(s)).join("\n");
}

export function downloadChatFormat(samples: ChatSample[], filename: string) {
  const jsonl = chatSamplesToJsonl(samples);
  const blob = new Blob([jsonl], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
