# 🔐 Setup de Admin com Custom Claims

Guia completo para configurar acesso administrativo seguro com custom claims no Firebase.

---

## 📋 Sumário

1. [Abrir Pull Request](#1-abrir-pull-request)
2. [Baixar Service Account Key](#2-baixar-service-account-key)
3. [Executar Script de Custom Claim](#3-executar-script-de-custom-claim)
4. [Configurar Deploy (Vercel/Netlify/Render)](#4-configurar-deploy)
5. [Validar Setup](#5-validar-setup)

---

## 1. Abrir Pull Request

**Branch:** `feature/admin-davyd-only`  
**Target:** `master`  
**Status:** Pronta para merge

### Link direto:
https://github.com/davydfontourac/confeitaria-app/compare/master...feature/admin-davyd-only?expand=1

### Ou via GitHub CLI:
```bash
gh pr create \
  --base master \
  --head feature/admin-davyd-only \
  --title "Security: custom admin claim + remove UID from client" \
  --body "Enforce admin via Firestore custom claims for enhanced security"
```

✅ **Próximo:** Merge o PR após review

---

## 2. Baixar Service Account Key

Este arquivo permite que você execute scripts admin no Firebase.

### Passos:

1. Acesse **Firebase Console** → seu projeto → **Project Settings** ⚙️
2. Clique na aba **Service Accounts**
3. Selecione **Node.js** (já deve estar selecionado)
4. Clique em **"Generate a new private key"**
5. Um arquivo `confeitaria-app-*.json` será baixado automaticamente
6. **Renomeie para `serviceAccountKey.json`** e coloque **na raiz do projeto**

### Verificar:
```bash
# Deve listar o arquivo
ls serviceAccountKey.json
```

⚠️ **IMPORTANTE:** Nunca commite este arquivo! Ele já está no `.gitignore`.

---

## 3. Executar Script de Custom Claim

Este script seta o custom claim `admin: true` no seu usuário no Firebase.

### Pré-requisitos:

```bash
# Instale as dependências (se ainda não tiver)
npm install firebase-admin dotenv
```

### Executar o script:

```bash
node scripts/setAdminClaim.js
```

### O script vai pedir:

```
📝 Insira o UID do usuário que será admin: 
```

### Como obter seu UID:

1. **Firebase Console** → **Authentication** → **Users**
2. Clique no seu usuário (davydfontoura@gmail.com)
3. Copie o campo **UID**
4. Cole no terminal

### Exemplo:

```
📝 Insira o UID do usuário que será admin: AbCdEfGhIjKlMnOpQrStUvWxYz
✅ Usuário encontrado: davydfontoura@gmail.com
✅ Custom claim 'admin' definido para davydfontoura@gmail.com
📋 Custom claims atualizados: { admin: true }
```

✅ **Pronto!** O custom claim foi setado uma única vez e persiste.

---

## 4. Configurar Deploy

Configure a variável `VITE_ADMIN_EMAIL` em cada plataforma.

### 4.1 Vercel

1. Acesse **vercel.com** → seu projeto
2. **Settings** → **Environment Variables**
3. Adicione:
   - **Name:** `VITE_ADMIN_EMAIL`
   - **Value:** `davydfontoura@gmail.com`
   - **Environment:** selecione `Production`, `Preview`, e `Development`
4. Clique em **Save**
5. Faça um novo deploy ou clique em **Redeploy**

### 4.2 Netlify

1. Acesse **netlify.com** → seu site
2. **Site settings** → **Build & deploy** → **Environment**
3. Clique em **Add environment variables**
4. Adicione:
   - **Key:** `VITE_ADMIN_EMAIL`
   - **Value:** `davydfontoura@gmail.com`
5. Clique em **Save**
6. Vá para **Deploys** e clique em **Deploy site** ou **Trigger deploy**

### 4.3 Render

1. Acesse **render.com** → seu serviço
2. **Environment** → clique no ícone de edição
3. Adicione:
   - **Key:** `VITE_ADMIN_EMAIL`
   - **Value:** `davydfontoura@gmail.com`
4. Clique em **Save Changes**
5. Vá para **Deploys** e clique em **Clear build cache and deploy**

---

## 5. Validar Setup

### Teste Local:

```bash
# 1. Certifique-se de que seu .env tem:
# VITE_ADMIN_EMAIL=davydfontoura@gmail.com

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Abra o app e faça login com davydfontoura@gmail.com

# 4. Verifique no console (F12):
console.log('Admin?', localStorage.getItem('adminEmail'))

# 5. Deve aparecer o menu com: Testes 🧪 | Debug 🐛 | Feedback 💬
```

### Teste em Produção:

1. Acesse seu app em produção
2. Faça login com `davydfontoura@gmail.com`
3. Deve aparecer: **Testes 🧪 | Debug 🐛 | Feedback Admin 💬**
4. Teste outro usuário → **não deve ver** os menus de admin

### Teste de Segurança (Firestore):

```javascript
// Abra o Console do navegador (F12) e execute:

// 1. Faça login com outro usuário
// 2. Cole isso no console:

db.collection('adminOperations').add({ test: 'data' })
  .then(() => console.log('❌ BUG! Não-admin conseguiu escrever!'))
  .catch(err => console.log('✅ Correto! Firestore bloqueou:', err.message));
```

---

## 🎯 Checklist Final

- [ ] PR aberto e mergeado
- [ ] `serviceAccountKey.json` baixado (não versionado)
- [ ] Script `setAdminClaim.js` executado
- [ ] `VITE_ADMIN_EMAIL` configurado em todos os deploys
- [ ] App redeployado
- [ ] Testado acesso admin local
- [ ] Testado acesso admin em produção
- [ ] Verificado que outros usuários não têm acesso admin

---

## 🔒 Segurança

**O que mudou:**

- ❌ Antes: Email hardcoded no código
- ✅ Agora: Email em variável de ambiente
- ❌ Antes: UID no cliente (visível no DevTools)
- ✅ Agora: UID setado apenas no servidor via custom claim
- ✅ Firestore valida custom claim para operações sensíveis

**Impossível hackear porque:**
1. Mesmo que alguém mude `.env` localmente, Firestore bloqueia sem custom claim
2. Custom claim é setado apenas via Firebase Admin SDK (servidor)
3. Cliente não consegue modificar seu próprio token

---

## ❓ Troubleshooting

### "Module not found: firebase-admin"
```bash
npm install firebase-admin dotenv
```

### "serviceAccountKey.json not found"
- Certifique-se de que o arquivo está na **raiz do projeto** (mesma pasta que `package.json`)
- Verifique o nome exato: `serviceAccountKey.json`

### "User not found with this UID"
- Verifique o UID copiado do Firebase Console → Authentication → Users
- UID é case-sensitive

### "Custom claim not showing in app"
- Faça logout e login novamente (força refresh do token)
- Aguarde alguns segundos (cache do Firebase)
- Verifique no Firebase Console → Authentication → Users → seu usuário → "Custom claims"

### Admin menu não aparece mesmo após tudo
1. Verifique `VITE_ADMIN_EMAIL` no `.env` (local ou deploy)
2. Faça logout e login novamente
3. Abra DevTools (F12) → Console e execute:
   ```javascript
   console.log('Current user email:', firebase.auth().currentUser.email);
   console.log('Admin email from env:', import.meta.env.VITE_ADMIN_EMAIL);
   ```

---

## 📞 Perguntas?

Se algo não funcionar, verifique:
1. Terminal output do script (mensagens de erro)
2. Firebase Console → Authentication → Users → verifique custom claims
3. Firestore Console → regras aplicadas corretamente
4. Network tab do DevTools → VITE_ADMIN_EMAIL sendo carregada

---

**Setup completo! Você agora é o único admin com acesso seguro. 🎉**
