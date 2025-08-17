const fs = require('fs');
const path = require('path');

const capacitorBuildGradlePath = path.join(__dirname, 'app', 'capacitor.build.gradle');

function fixJavaVersion() {
    try {
        // Leer el archivo
        let content = fs.readFileSync(capacitorBuildGradlePath, 'utf8');
        
        // Reemplazar Java 21 con Java 17
        const originalContent = content;
        content = content.replace(
            /sourceCompatibility JavaVersion\.VERSION_21/g,
            'sourceCompatibility JavaVersion.VERSION_17'
        );
        content = content.replace(
            /targetCompatibility JavaVersion\.VERSION_21/g,
            'targetCompatibility JavaVersion.VERSION_17'
        );
        
        // Si hubo cambios, escribir el archivo
        if (content !== originalContent) {
            fs.writeFileSync(capacitorBuildGradlePath, content, 'utf8');
            console.log('✅ Java version fixed: 21 → 17');
        } else {
            console.log('ℹ️  Java version already correct (17)');
        }
        
        // También verificar que el build.gradle principal tenga la configuración correcta
        const buildGradlePath = path.join(__dirname, 'app', 'build.gradle');
        let buildContent = fs.readFileSync(buildGradlePath, 'utf8');
        
        // Verificar si ya tiene la configuración de forzado
        if (!buildContent.includes('// Forzar Java 17 después de capacitor.build.gradle')) {
            console.log('⚠️  Build.gradle principal necesita configuración adicional');
        } else {
            console.log('✅ Build.gradle principal configurado correctamente');
        }
        
    } catch (error) {
        console.error('❌ Error fixing Java version:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixJavaVersion();
}

module.exports = { fixJavaVersion };
