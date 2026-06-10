/**
 * Pipeline Logger — structured logging for the blueprint generation pipeline.
 * Captures each stage of the prompt → AI → JSON → commands → canvas flow.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface PipelineLogEntry {
  timestamp: string;
  level: LogLevel;
  stage: string;
  message: string;
  data?: unknown;
  duration?: number;
}

class PipelineLogger {
  private logs: PipelineLogEntry[] = [];
  private maxLogs = 200;

  log(level: LogLevel, stage: string, message: string, data?: unknown, duration?: number) {
    const entry: PipelineLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      data,
      duration,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    const prefix = `[BlueprintPipeline:${stage}]`;
    const suffix = duration ? `(${duration}ms)` : "";

    switch (level) {
      case "debug":
        console.debug(`${prefix} ${message}`, data ?? "", suffix);
        break;
      case "info":
        console.info(`${prefix} ${message}`, data ?? "", suffix);
        break;
      case "warn":
        console.warn(`${prefix} ${message}`, data ?? "", suffix);
        break;
      case "error":
        console.error(`${prefix} ${message}`, data ?? "", suffix);
        break;
    }
  }

  debug(stage: string, message: string, data?: unknown) {
    this.log("debug", stage, message, data);
  }

  info(stage: string, message: string, data?: unknown) {
    this.log("info", stage, message, data);
  }

  warn(stage: string, message: string, data?: unknown) {
    this.log("warn", stage, message, data);
  }

  error(stage: string, message: string, data?: unknown) {
    this.log("error", stage, message, data);
  }

  stageStart(stage: string): () => number {
    const start = performance.now();
    return () => Math.round(performance.now() - start);
  }

  getLogs(): PipelineLogEntry[] {
    return [...this.logs];
  }

  getLogsByStage(stage: string): PipelineLogEntry[] {
    return this.logs.filter((l) => l.stage === stage);
  }

  clear() {
    this.logs = [];
  }
}

export const pipelineLogger = new PipelineLogger();
