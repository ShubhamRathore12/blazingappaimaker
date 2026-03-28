import { useState } from 'react';
import { Hammer, Download, Upload, Loader2 } from 'lucide-react';
import { createBuild, getBuild, deployBuild, listBuilds } from '../../api/builds';
import type { Build } from '@lovable-clone/shared';
import { toast } from 'sonner';

interface BuildPanelProps {
  projectId: string;
}

export default function BuildPanel({ projectId }: BuildPanelProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [building, setBuilding] = useState(false);
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null);

  const handleBuild = async (platform: 'android' | 'ios') => {
    setShowMenu(false);
    setBuilding(true);
    try {
      const build = await createBuild(projectId, platform);
      setCurrentBuild(build);
      toast.success(`${platform === 'android' ? 'Android' : 'iOS'} build started`);

      // Poll for completion
      const poll = setInterval(async () => {
        const updated = await getBuild(build.id);
        setCurrentBuild(updated);
        if (updated.status === 'success' || updated.status === 'failed') {
          clearInterval(poll);
          setBuilding(false);
          if (updated.status === 'success') {
            toast.success('Build completed!');
          } else {
            toast.error('Build failed');
          }
        }
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Build failed');
      setBuilding(false);
    }
  };

  const handleDeploy = async (store: 'play-store' | 'app-store') => {
    if (!currentBuild || currentBuild.status !== 'success') return;
    try {
      await deployBuild(currentBuild.id, store);
      toast.success(`Deployment to ${store === 'play-store' ? 'Play Store' : 'App Store'} started`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Deployment failed');
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {currentBuild?.status === 'success' && (
          <>
            <button
              onClick={() => handleDeploy('play-store')}
              className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg transition"
            >
              <Upload className="w-3 h-3" />
              Play Store
            </button>
            <button
              onClick={() => handleDeploy('app-store')}
              className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg transition"
            >
              <Upload className="w-3 h-3" />
              App Store
            </button>
          </>
        )}

        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={building}
          className="flex items-center gap-1.5 text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {building ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Hammer className="w-3.5 h-3.5" />
              Build
            </>
          )}
        </button>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-20 py-1 min-w-[180px]">
            <button
              onClick={() => handleBuild('android')}
              className="w-full text-left px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Build Android (APK)
            </button>
            <button
              onClick={() => handleBuild('ios')}
              className="w-full text-left px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Build iOS (IPA)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
