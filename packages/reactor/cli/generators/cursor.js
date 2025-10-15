import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function generateCursor(options = {}) {
  try {
    const templatePath = join(__dirname, '../../templates/cursor.md');
    const template = readFileSync(templatePath, 'utf-8');

    const outputPath = '.cursorrules';
    writeFileSync(outputPath, template);

    console.log('\n' + kleur.green('✓') + ' Created: ' + kleur.cyan(outputPath));
    console.log('\n' + kleur.bold('Next steps:'));
    console.log('  1. Restart Cursor AI');
    console.log('  2. Try: ' + kleur.yellow('"Create a todo list with svelte-reactor"'));
    console.log('  3. Cursor will use best practices automatically! 🎉\n');
  } catch (error) {
    console.error(kleur.red('✗ Error creating Cursor rules:'), error.message);
    process.exit(1);
  }
}
