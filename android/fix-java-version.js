const fs = require('fs');
const path = require('path');

const capacitorBuildGradlePath = path.join(__dirname, 'app', 'capacitor.build.gradle');

function fixJavaVersion() {
    try {
        let content = fs.readFileSync(capacitorBuildGradlePath, 'utf8');
        
        // Reemplazar Java 21 con Java 17
        const fixedContent = content.replace(
            /sourceCompatibility JavaVersion\.VERSION_21/g,
            'sourceCompatibility JavaVersion.VERSION_17'
        ).replace(
            /targetCompatibility JavaVersion\.VERSION_21/g,
            'targetCompatibility JavaVersion.VERSION_17'
        );
        
        if (content !== fixedContent) {
            fs.writeFileSync(capacitorBuildGradlePath, fixedContent);
            console.log('✅ Java version fixed: 21 → 17');
        } else {
            console.log('✅ Java version already correct (17)');
        }
    } catch (error) {
        console.error('❌ Error fixing Java version:', error.message);
    }
}

fixJavaVersion();
