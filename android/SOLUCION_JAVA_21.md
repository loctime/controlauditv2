# Solución para Error "invalid source release: 21"

## Problema
El error "invalid source release: 21" indica que el proyecto está configurado para usar Java 21, pero el entorno de desarrollo no lo soporta.

## Solución Aplicada

### 1. Modificación en `android/app/capacitor.build.gradle`
Cambiado de Java 21 a Java 17:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

### 2. Configuración adicional en `android/app/build.gradle`
Agregada configuración de Java 17 en el bloque `android`:
```gradle
android {
    // ... otras configuraciones ...
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    // ... resto de configuraciones ...
}
```

### 3. Configuración en `android/gradle.properties`
Agregada línea para configuración de Java (opcional):
```properties
# Configuración de Java para el proyecto
org.gradle.java.home=
```

## Scripts de Limpieza y Construcción

### Para Linux/Mac:
```bash
./clean-and-build.sh
```

### Para Windows:
```cmd
clean-and-build.bat
```

## Pasos para Aplicar la Solución

1. **Limpiar el proyecto:**
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Sincronizar dependencias:**
   ```bash
   ./gradlew --refresh-dependencies
   ```

3. **Construir el proyecto:**
   ```bash
   ./gradlew assembleDebug
   ```

## Notas Importantes

- **Java 17** es la versión recomendada para desarrollo Android actual
- El archivo `capacitor.build.gradle` se regenera automáticamente, por lo que los cambios pueden perderse
- Si el problema persiste, verificar que el JDK instalado sea compatible con Java 17
- En Android Studio, verificar: File > Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK

## Verificación

Para verificar que la solución funciona:
1. Ejecutar `./gradlew assembleDebug`
2. Si no hay errores de Java, la solución está aplicada correctamente
3. El APK se generará en `android/app/build/outputs/apk/debug/`

## Troubleshooting

Si el problema persiste:
1. Verificar versión de Java instalada: `java -version`
2. Verificar versión de Gradle: `./gradlew --version`
3. Limpiar cache de Gradle: `./gradlew clean build --refresh-dependencies`
4. Verificar configuración de Android Studio
