import { useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../stores/projectStore';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  projectId: string;
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown', css: 'css', html: 'html',
    dart: 'dart', yaml: 'yaml', yml: 'yaml', xml: 'xml',
  };
  return map[ext] || 'plaintext';
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

export default function CodeEditor({ projectId }: CodeEditorProps) {
  const { openTabs, activeTabPath, setActiveTab, closeTab, setFileContent, saveCurrentFile } = useProjectStore();

  const activeTab = openTabs.find(t => t.path === activeTabPath);

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentFile(projectId);
      toast.success('File saved');
    } catch {
      toast.error('Failed to save');
    }
  }, [projectId, saveCurrentFile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (openTabs.length === 0) {
    return (
      <div className="h-full bg-dark-900 flex items-center justify-center">
        <div className="text-center text-dark-500">
          <p className="text-sm">Select a file to edit</p>
          <p className="text-xs mt-1">or chat with AI to generate code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Tab bar */}
      <div className="flex items-center border-b border-dark-800 shrink-0 overflow-x-auto">
        <div className="flex items-center min-w-0">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-dark-800 min-w-0 group ${
                tab.path === activeTabPath
                  ? 'bg-dark-800 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-850'
              }`}
              onClick={() => setActiveTab(tab.path)}
            >
              <span className="truncate max-w-[120px]">{getFileName(tab.path)}</span>
              {tab.modified && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition shrink-0 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center px-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={!activeTab?.modified}
            className="flex items-center gap-1 text-xs text-dark-400 hover:text-white disabled:opacity-30 transition px-2 py-1 rounded hover:bg-dark-800"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>

      {/* File path breadcrumb */}
      {activeTab && (
        <div className="px-3 py-1 text-[10px] text-dark-500 border-b border-dark-800 shrink-0 truncate">
          {activeTab.path}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {activeTab && (
          <Editor
            key={activeTab.path}
            theme="vs-dark"
            language={getLanguage(activeTab.path)}
            value={activeTab.content}
            onChange={(value) => setFileContent(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              padding: { top: 8 },
            }}
          />
        )}
      </div>
    </div>
  );
}
