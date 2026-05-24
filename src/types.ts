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

export type ManagedProjectScope = "online" | "offline" | "hybrid";
export type ManagedProjectStatus = "planning" | "active" | "paused" | "done";

export interface GithubRepositoryMeta {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
  description: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  private: boolean;
  updatedAt: string;
}

export interface ManagedProject {
  id: string;
  name: string;
  scope: ManagedProjectScope;
  status: ManagedProjectStatus;
  localPath?: string;
  githubUrl?: string;
  environment?: string;
  content?: string;
  remark?: string;
  tags: string[];
  github?: GithubRepositoryMeta;
  updatedAt: string;
}

export type AppModuleId = "dashboard" | "system" | "launcher" | "safebox" | "sync" | "projects";

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
  managed_projects?: ManagedProject[];
  module_order?: AppModuleId[];
  user_profile?: {
    email?: string;
  };
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

export interface PortUsage {
  protocol: string;
  localAddress: string;
  port: number;
  state: string;
  pid: string;
  processName: string;
}
