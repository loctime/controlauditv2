const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173';
const BACKEND_BASE = process.env.BACKEND_BASE || 'http://localhost:4000';
const ID_TOKEN = process.env.ID_TOKEN || '';

async function main() {
  const j = r => r.json();
  
  try {
    const h1 = await fetch(`${FRONTEND_BASE}/api/health`).then(j);
    console.log('Frontend /api/health:', h1);
  } catch (e) {
    console.error('Error frontend health:', e);
  }
  
  try {
    const h2 = await fetch(`${BACKEND_BASE}/api/health`).then(j);
    console.log('Backend /api/health:', h2);
  } catch (e) {
    console.error('Error backend health:', e);
  }
  
  if (ID_TOKEN) {
    try {
      const ts = await fetch(`${FRONTEND_BASE}/api/user/taskbar`, {
        headers: {
          Authorization: `Bearer ${ID_TOKEN}`,
        },
      }).then(j);
      console.log('User taskbar:', ts);
    } catch (e) {
      console.error('Error user/taskbar:', e);
    }
  } else {
    console.log('ID_TOKEN no definido; omitiendo prueba protegida.');
  }
}

main();
