import type {
  HealthStatus,
  Project,
  BuildingDesign,
  BuildingDesignCreatePayload,
  AuthTokenResponse,
  BuildingRequirements,
} from "@/types/api";

const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status?: number };

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("access_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_HOST}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = response.statusText || "Request failed";
    try {
      const body = JSON.parse(text);
      errorMessage = (body?.detail as string) ?? (body?.message as string) ?? errorMessage;
    } catch {
      if (text) {
        errorMessage = text;
      }
    }

    return {
      success: false,
      error: `${response.status} ${errorMessage}`,
      status: response.status,
    };
  }

  const data = (await response.json()) as T;
  return { success: true, data };
}

export async function getHealth() {
  return request<HealthStatus>("/api/v1/health");
}

export async function getProjects() {
  return request<Project[]>("/api/v1/projects");
}

export async function createBuildingDesign(payload: BuildingDesignCreatePayload) {
  return request<BuildingDesign>("/api/v1/designs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string) {
  return request<AuthTokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, name: string, password: string) {
  return request<AuthTokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });
}

export function saveAccessToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("access_token", token);
  }
}

export function removeAccessToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("access_token");
  }
}

export function getAccessToken(): string | null {
  return getStoredToken();
}

export async function extractRequirements(prompt: string) {
  return request<BuildingRequirements>("/api/v1/architect/extract-requirements", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export async function analyzePrompt(prompt: string) {
  return request<{ success: boolean; requirements: BuildingRequirements }>("/api/v1/architect/analyze", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}


