// scripts/check-legacy-filters.js
import { readFileSync } from 'fs';
import glob from 'glob';

const patterns = [
  'clienteAdminId',
  'creadoPor',
  'createdBy',
  'migratedFromUid',
  'usuarioId'
];

const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
  nodir: true
});

let found = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');

  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      console.log(`⚠️ ${pattern} encontrado en ${file}`);
      found = true;
    }
  }
}

if (!found) {
  console.log('✅ No se encontraron filtros legacy');
} else {
  console.log('❌ Hay restos legacy. Revisar archivos listados arriba.');
}
