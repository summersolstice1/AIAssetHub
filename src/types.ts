export interface AIApp {
  id: string;
  name: string;
  url: string;
}

export interface APIKey {
  id: string;
  platform: string;
  key: string;
  dashboard_url: string;
}

export interface PromptItem {
  id: string;
  title: string;
  content: string;
}

export interface PromptsConfig {
  [category: string]: PromptItem[];
}

export interface DevApp {
  id: string;
  name: string;
  path: string;
  tag?: string;
}

export type EncryptionMethod = "AES-256-GCM" | "AES-256-CBC" | "ChaCha20-Poly1305" | "Local-DPAPI";

export interface PasswordItem {
  id: string;
  name: string;
  account: string;
  password?: string;
  remark?: string;
  encryption?: EncryptionMethod;
}

export interface PasswordsConfig {
  software: PasswordItem[];
  web: PasswordItem[];
  finance: PasswordItem[];
}

export interface AppConfig {
  ai_apps: AIApp[];
  api_keys: APIKey[];
  prompts: PromptsConfig;
  dev_apps: DevApp[];
  passwords: PasswordsConfig;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  gpuName: string;
  gpuVramUsed: number;
  gpuVramTotal: number;
  gpuTemp: number;
  cudaAvailable: boolean;
}

export interface EnvStatus {
  pythonVersion: string;
  condaEnvironments: string[];
  cudaVersion: string;
  jdkVersions: string[];
  toolchains: DevelopmentToolStatus[];
  refreshedAt: string;
}

export interface DevelopmentToolStatus {
  id: string;
  name: string;
  version: string;
  available: boolean;
}
