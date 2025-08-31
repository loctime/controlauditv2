#!/usr/bin/env node

/**
 * Script para probar el token del frontend con ControlFile
 */

const CONTROLFILE_URL = 'https://controlauditv2.onrender.com';

// Simular el token que se obtiene del frontend (ejemplo)
const TEST_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImVmMjQ4ZjQyZjc0YWUwZj...'; // Token de ejemplo

async function testFrontendToken() {
  console.log('🔍 Probando token del frontend con ControlFile');
  
  try {
    // Probar con el token que se obtiene del frontend
    const response = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error:', errorData);
    } else {
      const data = await response.json();
      console.log('Success:', data);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendToken();
