import { GithubRepositoryMeta } from "../types";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error || fallback);
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error;
      }
      throw new Error(fallback);
    }
  }

  return (await response.json()) as T;
}

export async function getGithubRepositoryMeta(githubUrl: string): Promise<GithubRepositoryMeta> {
  const query = new URLSearchParams({ url: githubUrl });
  const response = await fetch(`/api/github/repo?${query.toString()}`);
  return readJson<GithubRepositoryMeta>(response);
}
