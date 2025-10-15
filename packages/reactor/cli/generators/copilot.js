import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function generateCopilot(options = {}) {
  try {
    const templatePath = join(__dirname, '../../templates/copilot.md');
    const template = readFileSync(templatePath, 'utf-8');

    const outputDir = '.github';
    mkdirSync(outputDir, { recursive: true });

    const outputPath = join(outputDir, 'copilot-instructions.md');
    writeFileSync(outputPath, template);

    console.log('\n' + kleur.green('✓') + ' Created: ' + kleur.cyan(outputPath));
    console.log('\n' + kleur.bold('Next steps:'));
    console.log('  1. GitHub Copilot will automatically use these instructions');
    console.log('  2. Try: ' + kleur.yellow('"Create a shopping cart with svelte-reactor"'));
    console.log('  3. Copilot will suggest best practices! 🎉\n');
  } catch (error) {
    console.error(kleur.red('✗ Error creating Copilot instructions:'), error.message);
    process.exit(1);
  }
}
