import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { createProject } from '../api/projects';
import { toast } from 'sonner';

export default function NewProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<'react-native' | 'flutter'>('react-native');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await createProject(name, framework, description);
      toast.success('Project created!');
      navigate(`/project/${project.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-dark-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-primary-500" />
            <span className="font-bold">New Project</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Create a new project</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your app..."
              rows={3}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">Framework</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFramework('react-native')}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  framework === 'react-native'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-700 bg-dark-900 hover:border-dark-500'
                }`}
              >
                <div className="text-2xl mb-2">⚛️</div>
                <h3 className="font-semibold">React Native</h3>
                <p className="text-sm text-dark-400 mt-1">Expo + TypeScript</p>
              </button>
              <button
                type="button"
                onClick={() => setFramework('flutter')}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  framework === 'flutter'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-700 bg-dark-900 hover:border-dark-500'
                }`}
              >
                <div className="text-2xl mb-2">🐦</div>
                <h3 className="font-semibold">Flutter</h3>
                <p className="text-sm text-dark-400 mt-1">Dart + Material 3</p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </main>
    </div>
  );
}
