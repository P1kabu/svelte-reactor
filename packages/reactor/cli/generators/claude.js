import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function generateClaude(options = {}) {
  try {
    const templatePath = join(__dirname, '../../templates/claude.md');
    const template = readFileSync(templatePath, 'utf-8');

    const outputDir = '.claude';
    mkdirSync(outputDir, { recursive: true });

    const outputPath = join(outputDir, 'SVELTE_REACTOR_RULES.md');
    writeFileSync(outputPath, template);

    console.log('\n' + kleur.green('✓') + ' Created: ' + kleur.cyan(outputPath));
    console.log('\n' + kleur.bold('Next steps:'));
    console.log('  1. Restart Claude Code');
    console.log('  2. Try: ' + kleur.yellow('"Create a counter with svelte-reactor"'));
    console.log('  3. Claude will follow best practices automatically! 🎉\n');
  } catch (error) {
    console.error(kleur.red('✗ Error creating Claude rules:'), error.message);
    process.exit(1);
  }
}
