// Teste simples para verificar a configuração do Firebase
import './firebase.js';

console.log('✅ Firebase configurado com sucesso!');
console.log('🔑 Variáveis de ambiente carregadas:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅' : '❌');
console.log(
  'Auth Domain:',
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅' : '❌'
);
console.log(
  'Project ID:',
  import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅' : '❌'
);
