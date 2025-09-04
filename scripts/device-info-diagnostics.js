import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

async function runDeviceDiagnostics() {
  console.log('🔍 Diagnóstico detallado de información del dispositivo');
  
  try {
    // Información del dispositivo
    const info = await Device.getInfo();
    console.log('📱 Información del Dispositivo:');
    console.log('Modelo:', info.model);
    console.log('Plataforma:', info.platform);
    console.log('Versión del Sistema Operativo:', info.osVersion);
    console.log('Fabricante:', info.manufacturer);
    console.log('Tipo de Dispositivo:', info.type);
    
    // Información de la aplicación
    console.log('\n📲 Información de la Aplicación:');
    const config = Capacitor.getConfig();
    console.log('ID de la Aplicación:', config?.appId || 'No disponible');
    console.log('Nombre de la Aplicación:', config?.appName || 'No disponible');
    
    // Información de red
    console.log('\n🌐 Información de Red:');
    const networkStatus = await Device.getNetworkStatus();
    console.log('Estado de la Red:', JSON.stringify(networkStatus, null, 2));
    
    // Información de batería
    console.log('\n🔋 Información de Batería:');
    const batteryInfo = await Device.getBatteryInfo();
    console.log('Estado de la Batería:', JSON.stringify(batteryInfo, null, 2));
    
    // Información de localización
    console.log('\n🌍 Información de Localización:');
    const language = await Device.getLanguageCode();
    console.log('Código de Idioma:', language.value);
    
  } catch (error) {
    console.error('❌ Error en diagnóstico de dispositivo:', error);
  }
}

// Ejecutar diagnóstico
runDeviceDiagnostics().catch(console.error);
