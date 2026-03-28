import { useProjectStore } from '../../stores/projectStore';
import { File, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Trash2, FilePlus, FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { FileNode } from '@lovable-clone/shared';

interface FileExplorerProps {
  projectId: string;
}

function TreeNode({ node, projectId, depth = 0 }: { node: FileNode; projectId: string; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { activeTabPath, openFileByPath, deleteFile } = useProjectStore();

  const isActive = activeTabPath === node.path;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${node.name}"?`)) return;
    try {
      await deleteFile(projectId, node.path);
      toast.success(`Deleted ${node.name}`);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 px-2 py-1 text-xs text-dark-300 hover:text-white hover:bg-dark-800 transition group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          {expanded ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
          <span className="truncate flex-1 text-left">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <TreeNode key={child.path} node={child} projectId={projectId} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => openFileByPath(projectId, node.path)}
      className={`w-full flex items-center gap-1 px-2 py-1 text-xs transition group ${
        isActive ? 'bg-primary-500/20 text-primary-300' : 'text-dark-400 hover:text-white hover:bg-dark-800'
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <File className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate flex-1 text-left">{node.name}</span>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </button>
  );
}

export default function FileExplorer({ projectId }: FileExplorerProps) {
  const { fileTree, createFile, loadFileTree } = useProjectStore();
  const [showNewInput, setShowNewInput] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) { setShowNewInput(null); return; }
    try {
      if (showNewInput === 'file') {
        await createFile(projectId, newName.trim());
        toast.success(`Created ${newName.trim()}`);
      } else if (showNewInput === 'folder') {
        // Create folder by creating a .gitkeep inside it
        await createFile(projectId, `${newName.trim()}/.gitkeep`, '');
        toast.success(`Created folder ${newName.trim()}`);
      }
      await loadFileTree(projectId);
    } catch {
      toast.error('Failed to create');
    }
    setNewName('');
    setShowNewInput(null);
  };

  return (
    <div className="py-2 h-full flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowNewInput('file'); setNewName(''); }}
            className="text-dark-500 hover:text-white transition p-1"
            title="New file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setShowNewInput('folder'); setNewName(''); }}
            className="text-dark-500 hover:text-white transition p-1"
            title="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showNewInput && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-1">
            {showNewInput === 'file' ? <File className="w-3 h-3 text-dark-400" /> : <Folder className="w-3 h-3 text-yellow-500" />}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewInput(null); }}
              onBlur={handleCreate}
              placeholder={showNewInput === 'file' ? 'filename.tsx' : 'foldername'}
              className="flex-1 bg-dark-800 border border-dark-600 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {fileTree.length === 0 ? (
          <div className="px-3 py-4 text-xs text-dark-600">No files yet</div>
        ) : (
          fileTree.map((node) => (
            <TreeNode key={node.path} node={node} projectId={projectId} />
          ))
        )}
      </div>
    </div>
  );
}
