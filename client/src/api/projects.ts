import api from './client';
import type { Project, FileNode } from '@lovable-clone/shared';

export async function listProjects(): Promise<Project[]> {
  const res = await api.get('/projects');
  return res.data.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get(`/projects/${id}`);
  return res.data.data;
}

export async function createProject(name: string, framework: string, description?: string): Promise<Project> {
  const res = await api.post('/projects', { name, framework, description });
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function getFileTree(projectId: string): Promise<FileNode[]> {
  const res = await api.get(`/projects/${projectId}/files`);
  return res.data.data;
}

export async function getFileContent(projectId: string, filePath: string): Promise<string> {
  const res = await api.get(`/projects/${projectId}/files/${filePath}`);
  return res.data.data.content;
}

export async function saveFile(projectId: string, filePath: string, content: string): Promise<void> {
  await api.put(`/projects/${projectId}/files/${filePath}`, { content });
}

export async function deleteFile(projectId: string, filePath: string): Promise<void> {
  await api.delete(`/projects/${projectId}/files/${filePath}`);
}
