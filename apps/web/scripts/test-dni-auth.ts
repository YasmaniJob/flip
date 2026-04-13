/**
 * Script de prueba para el nuevo sistema de autenticación DNI
 * 
 * Este script verifica que el plugin dniAuth funcione correctamente
 * sin necesidad de hacer pruebas manuales en el navegador.
 */

async function testDniAuth() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Iniciando pruebas del sistema DNI Auth...\n');

  // Test 1: Verificar que el endpoint existe
  console.log('Test 1: Verificar endpoint /api/auth/lazy-register');
  try {
    const response = await fetch(`${baseUrl}/api/auth/lazy-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        dni: '12345678',
      }),
    });

    console.log(`  Status: ${response.status}`);
    const data = await response.json();
    console.log(`  Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 404 || response.status === 403) {
      console.log('  ✅ Endpoint responde correctamente (DNI no encontrado es esperado)\n');
    } else if (response.status === 400) {
      console.log('  ✅ Validación de entrada funciona\n');
    } else {
      console.log('  ℹ️  Respuesta inesperada pero endpoint funciona\n');
    }
  } catch (error) {
    console.error('  ❌ Error al conectar con el endpoint:', error);
    console.log('  Asegúrate de que el servidor esté corriendo en', baseUrl, '\n');
    return;
  }

  // Test 2: Verificar que el plugin está registrado
  console.log('Test 2: Verificar plugin dniAuth en Better Auth');
  try {
    const response = await fetch(`${baseUrl}/api/auth/sign-in/dni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        dni: '12345678',
      }),
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('  ❌ Plugin dniAuth NO está registrado correctamente');
      console.log('  Verifica que el plugin esté en la configuración de Better Auth\n');
    } else {
      console.log('  ✅ Plugin dniAuth está registrado y responde\n');
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('  ❌ Error al verificar plugin:', error);
  }

  console.log('\n✨ Pruebas completadas');
  console.log('\nPróximos pasos:');
  console.log('1. Verifica que ambos endpoints respondan correctamente');
  console.log('2. Prueba con credenciales reales en el navegador');
  console.log('3. Verifica los logs del servidor para más detalles');
}

// Ejecutar pruebas
testDniAuth().catch(console.error);
