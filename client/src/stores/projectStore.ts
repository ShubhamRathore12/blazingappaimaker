import { create } from 'zustand';
import type { Project, FileNode } from '@lovable-clone/shared';
import * as projectApi from '../api/projects';

interface OpenTab {
  path: string;
  content: string;
  modified: boolean;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  fileTree: FileNode[];
  openTabs: OpenTab[];
  activeTabPath: string | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  loadFileTree: (projectId: string) => Promise<void>;
  openFileByPath: (projectId: string, filePath: string) => Promise<void>;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  saveCurrentFile: (projectId: string) => Promise<void>;
  setFileContent: (content: string) => void;
  createFile: (projectId: string, filePath: string, content?: string) => Promise<void>;
  deleteFile: (projectId: string, filePath: string) => Promise<void>;
  resetWorkspace: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  fileTree: [],
  openTabs: [],
  activeTabPath: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    const projects = await projectApi.listProjects();
    set({ projects, loading: false });
  },

  loadProject: async (id) => {
    set({ loading: true });
    const project = await projectApi.getProject(id);
    set({ currentProject: project, loading: false });
  },

  loadFileTree: async (projectId) => {
    const tree = await projectApi.getFileTree(projectId);
    set({ fileTree: tree });
  },

  openFileByPath: async (projectId, filePath) => {
    const { openTabs } = get();
    // Check if already open
    const existing = openTabs.find(t => t.path === filePath);
    if (existing) {
      set({ activeTabPath: filePath });
      return;
    }
    const content = await projectApi.getFileContent(projectId, filePath);
    set({
      openTabs: [...openTabs, { path: filePath, content, modified: false }],
      activeTabPath: filePath,
    });
  },

  closeTab: (path) => {
    const { openTabs, activeTabPath } = get();
    const newTabs = openTabs.filter(t => t.path !== path);
    let newActive = activeTabPath;
    if (activeTabPath === path) {
      const idx = openTabs.findIndex(t => t.path === path);
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.path || null;
    }
    set({ openTabs: newTabs, activeTabPath: newActive });
  },

  setActiveTab: (path) => set({ activeTabPath: path }),

  saveCurrentFile: async (projectId) => {
    const { openTabs, activeTabPath } = get();
    const tab = openTabs.find(t => t.path === activeTabPath);
    if (!tab) return;
    await projectApi.saveFile(projectId, tab.path, tab.content);
    set({
      openTabs: openTabs.map(t => t.path === activeTabPath ? { ...t, modified: false } : t),
    });
  },

  setFileContent: (content) => {
    const { openTabs, activeTabPath } = get();
    set({
      openTabs: openTabs.map(t => t.path === activeTabPath ? { ...t, content, modified: true } : t),
    });
  },

  createFile: async (projectId, filePath, content = '') => {
    await projectApi.saveFile(projectId, filePath, content);
    await get().loadFileTree(projectId);
  },

  deleteFile: async (projectId, filePath) => {
    await projectApi.deleteFile(projectId, filePath);
    get().closeTab(filePath);
    await get().loadFileTree(projectId);
  },

  resetWorkspace: () => {
    set({
      currentProject: null,
      fileTree: [],
      openTabs: [],
      activeTabPath: null,
    });
  },
}));
