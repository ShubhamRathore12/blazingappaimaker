import { Link } from 'react-router-dom';
import { Smartphone, Zap, Rocket, Code2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold">AppForge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-dark-300 hover:text-white transition">Login</Link>
            <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          Build Mobile Apps<br />with AI
        </h1>
        <p className="text-xl text-dark-300 mb-10 max-w-2xl mx-auto">
          Describe your app idea, and AppForge generates production-ready React Native or Flutter code.
          Build APKs, deploy to stores — all from your browser.
        </p>
        <Link to="/signup" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
          Start Building for Free
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-800">
          <Zap className="w-10 h-10 text-primary-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
          <p className="text-dark-400">Describe what you want. Our AI generates complete, production-ready mobile app code using Claude or GPT.</p>
        </div>
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-800">
          <Code2 className="w-10 h-10 text-primary-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">React Native & Flutter</h3>
          <p className="text-dark-400">Choose your framework. Build for both Android and iOS from a single codebase with live preview.</p>
        </div>
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-800">
          <Rocket className="w-10 h-10 text-primary-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">One-Click Deploy</h3>
          <p className="text-dark-400">Generate APK/IPA files and deploy directly to Google Play Store and Apple App Store.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 px-6 py-8 text-center text-dark-500">
        AppForge — Build mobile apps with AI
      </footer>
    </div>
  );
}
