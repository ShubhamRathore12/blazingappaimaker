import api from './client';
import type { Build, Deployment } from '@lovable-clone/shared';

export async function createBuild(projectId: string, platform: string): Promise<Build> {
  const res = await api.post(`/projects/${projectId}/builds`, { platform });
  return res.data.data;
}

export async function listBuilds(projectId: string): Promise<Build[]> {
  const res = await api.get(`/projects/${projectId}/builds`);
  return res.data.data;
}

export async function getBuild(buildId: string): Promise<Build> {
  const res = await api.get(`/builds/${buildId}`);
  return res.data.data;
}

export async function deployBuild(buildId: string, store: string): Promise<Deployment> {
  const res = await api.post(`/builds/${buildId}/deploy`, { store });
  return res.data.data;
}

export async function getDeployment(deployId: string): Promise<Deployment> {
  const res = await api.get(`/deployments/${deployId}`);
  return res.data.data;
}
