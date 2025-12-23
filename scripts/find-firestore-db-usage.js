// scripts/find-firestore-db-usage.js
import fs from 'fs';
import path from 'path';

const ROOT_DIR = './src';
const PATTERN = /collection\s*\(\s*db\s*,/;

const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (
      fullPath.endsWith('.js') ||
      fullPath.endsWith('.jsx') ||
      fullPath.endsWith('.ts') ||
      fullPath.endsWith('.tsx')
    ) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (PATTERN.test(content)) {
        results.push(fullPath);
      }
    }
  }
}

walk(ROOT_DIR);

console.log('Archivos con collection(db, ...):\n');
results.forEach((f, i) => {
  console.log(`${i + 1}. ${f}`);
});

console.log(`\nTotal: ${results.length}`);
