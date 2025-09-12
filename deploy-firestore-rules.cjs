const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar si Firebase CLI está instalado
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI encontrado');
} catch (error) {
  console.error('❌ Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools');
  process.exit(1);
}

// Verificar si existe el archivo de reglas
const rulesFile = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesFile)) {
  console.error('❌ No se encontró el archivo firestore.rules');
  process.exit(1);
}

console.log('📝 Desplegando reglas de Firestore...');

try {
  // Desplegar las reglas
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Reglas de Firestore desplegadas correctamente');
} catch (error) {
  console.error('❌ Error desplegando reglas de Firestore:', error.message);
  console.log('\n📋 Pasos manuales:');
  console.log('1. Ve a https://console.firebase.google.com/');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a Firestore Database > Reglas');
  console.log('4. Copia el contenido de firestore.rules');
  console.log('5. Pega y publica las reglas');
  process.exit(1);
}
