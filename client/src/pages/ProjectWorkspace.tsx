import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useChatStore } from '../stores/chatStore';
import ChatPanel from '../components/chat/ChatPanel';
import CodeEditor from '../components/editor/CodeEditor';
import FileExplorer from '../components/editor/FileExplorer';
import PreviewPanel from '../components/preview/PreviewPanel';
import BuildPanel from '../components/build/BuildPanel';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loadProject, loadFileTree, openFileByPath, resetWorkspace } = useProjectStore();
  const { loadConversations, resetChat } = useChatStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFileWrite = useCallback((filePath?: string) => {
    if (id) {
      loadFileTree(id);
      setRefreshTrigger(t => t + 1);
      if (filePath) {
        openFileByPath(id, filePath);
      }
    }
  }, [id, loadFileTree, openFileByPath]);

  useEffect(() => {
    if (id) {
      // Reset old state before loading new project
      resetWorkspace();
      resetChat();
      loadProject(id);
      loadFileTree(id);
      loadConversations(id);
    }
  }, [id]);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-dark-400">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-dark-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Smartphone className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-sm">{currentProject.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            currentProject.framework === 'react-native'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {currentProject.framework === 'react-native' ? 'React Native' : 'Flutter'}
          </span>
        </div>
        <BuildPanel projectId={currentProject.id} />
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-56 border-r border-dark-800 overflow-y-auto shrink-0">
          <FileExplorer projectId={currentProject.id} />
        </div>

        {/* Resizable panels */}
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={30} minSize={20}>
            <ChatPanel
              projectId={currentProject.id}
              onFileWrite={handleFileWrite}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-dark-800 hover:bg-primary-500 transition-colors" />

          <Panel defaultSize={40} minSize={20}>
            <CodeEditor projectId={currentProject.id} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-dark-800 hover:bg-primary-500 transition-colors" />

          <Panel defaultSize={30} minSize={20}>
            <PreviewPanel
              framework={currentProject.framework}
              projectId={currentProject.id}
              refreshTrigger={refreshTrigger}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
