import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Smartphone, Tablet, Monitor, Play, Square, Loader2 } from 'lucide-react';
import { startPreview, getPreview, restartPreview } from '../../api/preview';
import { toast } from 'sonner';

interface PreviewPanelProps {
  framework: string;
  projectId: string;
  refreshTrigger?: number;
}

const devices = [
  { name: 'Phone', icon: Smartphone, width: 375, height: 667 },
  { name: 'Tablet', icon: Tablet, width: 768, height: 1024 },
  { name: 'Desktop', icon: Monitor, width: '100%' as any, height: '100%' as any },
];

export default function PreviewPanel({ framework, projectId, refreshTrigger }: PreviewPanelProps) {
  const [device, setDevice] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewPort, setPreviewPort] = useState<number | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string>('idle');

  // Poll for preview ready status
  useEffect(() => {
    if (previewStatus !== 'starting') return;

    const interval = setInterval(async () => {
      try {
        const result = await getPreview(projectId);
        if (result && result.status === 'ready') {
          setPreviewStatus('ready');
          setPreviewPort(result.port);
          clearInterval(interval);
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [previewStatus, projectId]);

  // Auto-refresh iframe when AI writes files
  useEffect(() => {
    if (refreshTrigger && previewStatus === 'ready') {
      // Small delay to let HMR pick up changes
      setTimeout(() => setRefreshKey(k => k + 1), 1500);
    }
  }, [refreshTrigger]);

  const handleStart = useCallback(async () => {
    setPreviewStatus('installing');
    toast.info('Starting preview... Installing dependencies (this may take a minute)');
    try {
      const result = await startPreview(projectId);
      setPreviewPort(result.port);
      if (result.status === 'ready') {
        setPreviewStatus('ready');
        toast.success('Preview is ready!');
      } else {
        setPreviewStatus('starting');
        toast.info('Dependencies installed. Starting Expo web server...');
      }
    } catch (err: any) {
      setPreviewStatus('error');
      toast.error('Failed to start preview');
    }
  }, [projectId]);

  const handleRestart = useCallback(async () => {
    setPreviewStatus('starting');
    try {
      const result = await restartPreview(projectId);
      setPreviewPort(result.port);
      setPreviewStatus(result.status === 'ready' ? 'ready' : 'starting');
      setRefreshKey(k => k + 1);
    } catch {
      toast.error('Failed to restart preview');
    }
  }, [projectId]);

  const previewUrl = previewPort ? `http://localhost:${previewPort}` : null;

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dark-800 shrink-0">
        <div className="flex items-center gap-1">
          {devices.map((d, i) => (
            <button
              key={d.name}
              onClick={() => setDevice(i)}
              className={`p-1.5 rounded transition ${
                device === i ? 'bg-dark-700 text-white' : 'text-dark-500 hover:text-white'
              }`}
              title={d.name}
            >
              <d.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {previewStatus === 'ready' && (
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="text-dark-500 hover:text-white transition p-1.5"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {previewStatus === 'idle' || previewStatus === 'error' ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-2.5 py-1.5 rounded-lg transition"
            >
              <Play className="w-3 h-3" />
              Run Preview
            </button>
          ) : previewStatus === 'ready' ? (
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 text-xs bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-2.5 py-1.5 rounded-lg transition"
            >
              <RefreshCw className="w-3 h-3" />
              Restart
            </button>
          ) : null}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-dark-950">
        {previewStatus === 'ready' && previewUrl ? (
          <div
            className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-dark-700"
            style={{
              width: devices[device].width,
              height: devices[device].height,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : previewStatus === 'installing' || previewStatus === 'starting' ? (
          <div className="text-center">
            <div className="mx-auto w-[280px] h-[560px] bg-dark-900 rounded-[3rem] border-4 border-dark-700 relative overflow-hidden flex items-center justify-center">
              <div className="text-center px-6">
                <Loader2 className="w-10 h-10 text-primary-500 mx-auto mb-4 animate-spin" />
                <p className="text-sm text-dark-300 font-medium">
                  {previewStatus === 'installing' ? 'Installing dependencies...' : 'Starting Expo Web...'}
                </p>
                <p className="text-xs text-dark-500 mt-2">This may take a minute on first run</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-[280px] h-[560px] bg-dark-900 rounded-[3rem] border-4 border-dark-700 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-dark-700 rounded-b-2xl" />
              <div className="mt-8 mx-3 mb-3 h-[calc(100%-4rem)] bg-dark-800 rounded-2xl flex items-center justify-center">
                <div className="text-center px-4">
                  <Play className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-dark-400 font-medium">Click "Run Preview"</p>
                  <p className="text-xs text-dark-600 mt-2">
                    Chat with AI to generate code, then run the preview to see your app live
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
