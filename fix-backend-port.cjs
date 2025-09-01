const fs = require('fs');
const path = require('path');

// Cambiar puerto del backend
const backendEnvPath = path.join(__dirname, 'backend', 'env.local');

try {
  let content = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Cambiar PORT=4000 a PORT=4001
  content = content.replace(/PORT=4000/g, 'PORT=4001');
  
  fs.writeFileSync(backendEnvPath, content);
  
  console.log('✅ Puerto del backend cambiado de 4000 a 4001');
  console.log('📁 Archivo actualizado:', backendEnvPath);
  
} catch (error) {
  console.error('❌ Error cambiando puerto del backend:', error.message);
}
