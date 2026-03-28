export type Framework = 'react-native' | 'flutter';
export type ProjectStatus = 'active' | 'archived' | 'deleted';
export type BuildPlatform = 'android' | 'ios';
export type BuildStatus = 'queued' | 'building' | 'success' | 'failed';
export type DeployStore = 'play-store' | 'app-store';
export type DeployStatus = 'pending' | 'uploading' | 'submitted' | 'live' | 'failed';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  framework: Framework;
  status: ProjectStatus;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: string;
  projectId: string;
  platform: BuildPlatform;
  status: BuildStatus;
  buildLog: string | null;
  artifactUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Deployment {
  id: string;
  buildId: string;
  store: DeployStore;
  status: DeployStatus;
  storeUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}
