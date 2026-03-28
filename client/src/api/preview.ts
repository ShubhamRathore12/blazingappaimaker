import api from './client';

export async function startPreview(projectId: string): Promise<{ port: number; status: string }> {
  const res = await api.post(`/projects/${projectId}/preview/start`);
  return res.data.data;
}

export async function getPreview(projectId: string): Promise<{ port: number; status: string } | null> {
  const res = await api.get(`/projects/${projectId}/preview`);
  return res.data.data;
}

export async function restartPreview(projectId: string): Promise<{ port: number; status: string }> {
  const res = await api.post(`/projects/${projectId}/preview/restart`);
  return res.data.data;
}

export async function stopPreview(projectId: string): Promise<void> {
  await api.post(`/projects/${projectId}/preview/stop`);
}
