/**
 * CONFIGURAÇÃO DE CUSTOM CLAIM 'ADMIN' NO FIREBASE
 * 
 * Este script define o custom claim 'admin' para um usuário específico no Firebase.
 * Execute apenas uma vez para seu usuário admin.
 * 
 * COMO USAR:
 * 1. Instale o Firebase Admin SDK:
 *    npm install firebase-admin
 * 
 * 2. Crie um arquivo de credenciais:
 *    - Firebase Console → Project Settings → Service Accounts
 *    - Clique "Generate new private key"
 *    - Salve como "serviceAccountKey.json" na raiz do projeto
 * 
 * 3. Execute este script (no Node.js):
 *    node scripts/setAdminClaim.js
 * 
 * 4. Quando solicitado, insira o UID do usuário que será admin
 *    (encontre em Firebase Console → Authentication → Users)
 */

// Para usar este script:
// 1. Instale: npm install firebase-admin dotenv
// 2. Configure as chaves no .env ou serviceAccountKey.json
// 3. Execute: node scripts/setAdminClaim.js

const admin = require('firebase-admin');
const readline = require('readline');
require('dotenv').config();

// Importar credenciais (você precisa ter serviceAccountKey.json na raiz)
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('❌ Erro: serviceAccountKey.json não encontrado na raiz do projeto');
  console.error('   Baixe em: Firebase Console → Project Settings → Service Accounts → Generate Key');
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

async function setAdminClaim() {
  try {
    const uid = await question(
      '📝 Insira o UID do usuário que será admin: '
    );

    if (!uid || uid.trim().length === 0) {
      console.error('❌ UID não pode estar vazio');
      rl.close();
      return;
    }

    // Verificar se o usuário existe
    const user = await admin.auth().getUser(uid);
    console.log(`✅ Usuário encontrado: ${user.email}`);

    // Setar o custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Custom claim 'admin' definido para ${user.email}`);

    // Confirmar
    const updatedUser = await admin.auth().getUser(uid);
    console.log('📋 Custom claims atualizados:', updatedUser.customClaims);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ Usuário não encontrado com este UID');
    } else {
      console.error('❌ Erro:', error.message);
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

setAdminClaim();
