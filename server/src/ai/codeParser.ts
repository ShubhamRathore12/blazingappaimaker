export interface ParsedCodeBlock {
  filePath: string;
  language: string;
  content: string;
}

/**
 * Extracts code blocks with file path annotations from AI response text.
 * Supports format: ```language file=path/to/file.ext
 */
// Config files that the AI must not overwrite
const PROTECTED_FILES = new Set([
  'package.json', 'package-lock.json', 'app.json', 'tsconfig.json',
  'pubspec.yaml', 'pubspec.lock', '.gitignore', 'babel.config.js',
]);

// Known top-level folders in React Native projects
const ROOT_FOLDERS = ['screens', 'components', 'hooks', 'navigation', 'models', 'utils', 'services', 'context', 'constants', 'assets', 'styles', 'types', 'lib'];

/**
 * Fix broken relative imports in files inside subdirectories.
 * e.g. in navigation/AppNavigator.tsx, `./screens/Home` should be `../screens/Home`
 */
function fixRelativeImports(filePath: string, content: string): string {
  const parts = filePath.split('/');
  if (parts.length < 2) return content; // root-level file, no fix needed

  // File is in a subdirectory — check for imports to sibling root folders
  // Match: import X from './folder/...' or from "./folder/..."
  const importRegex = /(from\s+['"])\.\/(screens|components|hooks|navigation|models|utils|services|context|constants|assets|styles|types)(\/[^'"]*['"])/g;

  const fixed = content.replace(importRegex, (match, prefix, folder, rest) => {
    console.log(`[codeParser] Fixed import in ${filePath}: ./${folder}${rest} → ../${folder}${rest}`);
    return `${prefix}../${folder}${rest}`;
  });

  return fixed;
}

export function parseCodeBlocks(text: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = [];
  const regex = /```(\w+)\s+file=([^\n]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const filePath = match[2].trim();
    const fileName = filePath.split('/').pop() || filePath;
    if (PROTECTED_FILES.has(fileName)) {
      console.log(`[codeParser] Skipping protected file: ${filePath}`);
      continue;
    }

    // Fix relative imports for files in subdirectories
    const content = fixRelativeImports(filePath, match[3].trimEnd());

    blocks.push({
      language: match[1],
      filePath,
      content,
    });
  }

  return blocks;
}
