// Teste de configuração Firebase
console.log('🔥 Testando configuração Firebase...');

console.log('Variáveis de ambiente:');
console.log(
  'API_KEY:',
  import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Carregada' : '❌ Não encontrada'
);
console.log(
  'AUTH_DOMAIN:',
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    ? '✅ Carregada'
    : '❌ Não encontrada'
);
console.log(
  'PROJECT_ID:',
  import.meta.env.VITE_FIREBASE_PROJECT_ID
    ? '✅ Carregada'
    : '❌ Não encontrada'
);
console.log(
  'STORAGE_BUCKET:',
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    ? '✅ Carregada'
    : '❌ Não encontrada'
);
console.log(
  'MESSAGING_SENDER_ID:',
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ? '✅ Carregada'
    : '❌ Não encontrada'
);
console.log(
  'APP_ID:',
  import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Carregada' : '❌ Não encontrada'
);

console.log('\n🔧 Valores atuais:');
console.log('API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
