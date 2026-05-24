import { EnvStatus, PortUsage, SystemMetrics } from "../types";

let cachedEnvironment: EnvStatus | null = null;
let pendingEnvironmentRequest: Promise<EnvStatus> | null = null;

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const response = await fetch("/api/system/metrics");
  return readJson<SystemMetrics>(response);
}

export async function getPortUsage(): Promise<PortUsage[]> {
  const response = await fetch("/api/system/ports");
  return readJson<PortUsage[]>(response);
}

export async function getEnvironmentStatus(forceRefresh = false): Promise<EnvStatus> {
  if (cachedEnvironment && !forceRefresh) {
    return cachedEnvironment;
  }

  if (pendingEnvironmentRequest && !forceRefresh) {
    return pendingEnvironmentRequest;
  }

  pendingEnvironmentRequest = fetch("/api/system/env")
    .then((response) => readJson<EnvStatus>(response))
    .then((environment) => {
      cachedEnvironment = environment;
      return environment;
    })
    .finally(() => {
      pendingEnvironmentRequest = null;
    });

  return pendingEnvironmentRequest;
}

export function getCachedEnvironmentStatus(): EnvStatus | null {
  return cachedEnvironment;
}
