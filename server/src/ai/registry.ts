import type { LLMProvider } from './types.js';

class AIRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider "${name}" not registered. Available: ${this.list().join(', ')}`);
    }
    return provider;
  }

  getDefault(): LLMProvider {
    const first = this.providers.values().next();
    if (first.done) throw new Error('No AI providers registered');
    return first.value;
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }
}

export const aiRegistry = new AIRegistry();
