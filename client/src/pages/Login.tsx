import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Smartphone className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold">AppForge</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-dark-400 mt-1">Sign in to continue building</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-xl border border-dark-800 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-dark-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-500 hover:text-primary-400">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
