import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve } from 'path';

console.log('📦 Analyzing bundle size...\n');

const distPath = resolve(process.cwd(), '../packages/core/dist/index.js');

try {
  const content = readFileSync(distPath, 'utf-8');
  const gzipped = gzipSync(content);

  const sizes = {
    raw: content.length,
    gzipped: gzipped.length,
  };

  console.log('Bundle Size Analysis:');
  console.log('─'.repeat(50));
  console.log(`Raw size:      ${(sizes.raw / 1024).toFixed(2)} KB`);
  console.log(`Gzipped size:  ${(sizes.gzipped / 1024).toFixed(2)} KB`);
  console.log('─'.repeat(50));

  // Check if under target size
  const targetKB = 5;
  const actualKB = sizes.gzipped / 1024;

  if (actualKB <= targetKB) {
    console.log(`✅ Under target size of ${targetKB}KB`);
  } else {
    console.log(`⚠️  Over target size of ${targetKB}KB by ${(actualKB - targetKB).toFixed(2)}KB`);
  }

  console.log('\n✅ Bundle size analysis complete!');
} catch (error) {
  console.error('Error analyzing bundle:', error.message);
  process.exit(1);
}
