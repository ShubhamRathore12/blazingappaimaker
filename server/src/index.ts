import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { aiRegistry } from './ai/registry.js';
import { ClaudeProvider } from './ai/providers/claude.provider.js';
import { OpenAIProvider } from './ai/providers/openai.provider.js';
import { GeminiProvider } from './ai/providers/gemini.provider.js';
import { GroqProvider } from './ai/providers/groq.provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://blazingappaimaker-client.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', providers: aiRegistry.list() });
});

// Serve frontend static files in production
if (config.nodeEnv === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

// Register AI providers (first registered = default)
if (config.groqApiKey) {
  aiRegistry.register(new GroqProvider(config.groqApiKey));
  console.log('Registered Groq AI provider (FREE - default)');
}
if (config.geminiApiKey) {
  aiRegistry.register(new GeminiProvider(config.geminiApiKey));
  console.log('Registered Gemini AI provider (FREE)');
}
if (config.anthropicApiKey) {
  aiRegistry.register(new ClaudeProvider(config.anthropicApiKey));
  console.log('Registered Claude AI provider');
}
if (config.openaiApiKey) {
  aiRegistry.register(new OpenAIProvider(config.openaiApiKey));
  console.log('Registered OpenAI provider');
}

if (aiRegistry.list().length === 0) {
  console.warn('WARNING: No AI providers configured. Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env');
}

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Projects root: ${config.projectsRoot}`);
});

export default app;
