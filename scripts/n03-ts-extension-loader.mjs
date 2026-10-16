import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Reuse the same extension-resolution contract as the N02 runtime adapter.
// Keep source imports unchanged and resolve extensionless relative TypeScript modules.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.endsWith('.ts') && !specifier.endsWith('.js')) {
        const candidate = new URL(specifier + '.ts', context.parentURL);
        try {
          await access(fileURLToPath(candidate));
          return await nextResolve(candidate.href, context);
        } catch {}
      }
      throw error;
    }
  }
  return nextResolve(specifier, context);
}
