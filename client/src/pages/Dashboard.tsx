import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Smartphone, Trash2, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { deleteProject } from '../api/projects';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout, loadUser } = useAuthStore();
  const { projects, loading, loadProjects } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    try {
      await deleteProject(id);
      await loadProjects();
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-primary-500" />
            <span className="text-lg font-bold">AppForge</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-dark-400 text-sm">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="text-dark-400 hover:text-white transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <Link
            to="/new-project"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-dark-400 py-20">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Smartphone className="w-16 h-16 text-dark-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-dark-400 mb-6">Create your first mobile app project</p>
            <Link
              to="/new-project"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-dark-900 border border-dark-800 rounded-xl p-5 hover:border-dark-600 transition group">
                <Link to={`/project/${project.id}`} className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      project.framework === 'react-native'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {project.framework === 'react-native' ? 'React Native' : 'Flutter'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                  <p className="text-dark-400 text-sm line-clamp-2">{project.description || 'No description'}</p>
                </Link>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-800">
                  <span className="text-xs text-dark-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="text-dark-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
