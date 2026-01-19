# 🧁 WebApp Confeitaria

Uma aplicação web completa para gerenciamento de confeitaria com cálculo de custos, precificação inteligente e controle de receitas. Desenvolvida com React, TypeScript e Firebase.

## ✨ Características Principais

### 🎨 Interface e UX

- **Design Moderno**: Interface elegante com gradientes e animações suaves
- **📱 Mobile-First**: Totalmente otimizada para dispositivos móveis com componentes específicos
- **🎯 Responsividade Avançada**: Layout adaptativo com breakpoints inteligentes
- **⚡ Performance**: Lazy loading, React.memo e otimizações de rendering
- **🌈 Animações Fluidas**: Transições CSS customizadas e micro-interações

### 🔐 Autenticação e Segurança

- **Login/Registro Completo**: Sistema de autenticação robusto
- **🛡️ Recuperação de Senha**: Fluxo completo de reset via email
- **🔒 Rotas Protegidas**: Sistema de proteção de páginas
- **⚠️ Tratamento de Erros**: Sistema centralizado com mensagens amigáveis
- **🔄 Retry Automático**: Recuperação automática de falhas de rede

### 📊 Funcionalidades de Negócio

- **💰 Cálculo de Custos**: Precisão automática de ingredientes e mão-de-obra
- **📈 Análise de Lucratividade**: Dashboard com gráficos interativos (Chart.js)
- **📋 Gestão de Receitas**: CRUD completo com validação em tempo real
- **💾 Backup/Export**: Sistema completo de exportação e importação de dados
- **🏷️ Categorização**: Sistema de tags e categorias para organização
- **⭐ Favoritos**: Marque receitas importantes para acesso rápido

### 🔧 Recursos Técnicos

- **🎯 TypeScript**: 100% tipado para máxima confiabilidade
- **🚀 React 19**: Últimas funcionalidades e performance
- **🔥 Firebase**: Auth + Firestore com regras de segurança robustas
- **📱 PWA Ready**: Otimizada para instalação como app móvel
- **🔧 Diagnóstico**: Ferramentas integradas para debug e monitoramento

## 🚀 Stack Tecnológica

### Frontend

- **React 19** + **TypeScript** - Framework principal
- **Tailwind CSS** - Styling utility-first
- **React Router DOM** - Roteamento SPA
- **React Hot Toast** - Notificações elegantes
- **Chart.js + react-chartjs-2** - Gráficos e analytics
- **React Suspense** - Lazy loading e loading states

### Backend & Infraestrutura

- **Firebase Auth** - Autenticação de usuários
- **Firestore Database** - Banco NoSQL em tempo real
- **Firebase Security Rules** - Regras de acesso granulares
- **Vite** - Build tool e dev server ultra-rápido

### DevOps & Qualidade

- **ESLint + TypeScript** - Análise estática de código
- **Git Flow** - Controle de versão organizado
- **Error Boundaries** - Captura e tratamento de erros React
- **Performance Monitoring** - Métricas de performance integradas

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 18+)
- npm ou yarn
- Conta no Firebase

### Passos para instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd webapp-confeitaria/confeitaria-app
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

4. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative a Autenticação com Email/Senha
   - Copie suas credenciais para o arquivo `.env`:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sua_project_id
VITE_FIREBASE_STORAGE_BUCKET=sua_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

5. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   ├── AutocompleteInput.tsx    # Campo de entrada com autocomplete
│   ├── ConfirmModal.tsx         # Modal de confirmação
│   ├── Header.tsx               # Cabeçalho da aplicação
│   ├── IngredientRow.tsx        # Linha de ingrediente editável
│   ├── Layout.tsx               # Layout base das páginas
│   ├── LoadingSpinner.tsx       # Indicador de carregamento
│   ├── ProgressBar.tsx          # Barra de progresso
│   ├── ProtectedRoute.tsx       # Proteção de rotas
│   ├── SkeletonLoader.tsx       # Loading placeholder
│   └── TagsInput.tsx            # Campo de tags
├── contexts/          # Contextos React
│   ├── AuthContext.tsx          # Contexto de autenticação
│   └── AuthContextTypes.ts     # Tipos do contexto
├── hooks/             # Hooks customizados
│   └── useAuth.ts               # Hook de autenticação
├── pages/             # Páginas da aplicação
│   ├── Dashboard.tsx            # Painel principal
│   ├── EditarReceita.tsx        # Edição de receitas
│   ├── FirestoreDebug.tsx       # Diagnóstico Firebase
│   ├── FirestoreTest.tsx        # Testes Firebase
│   ├── ForgotPassword.tsx       # Recuperação de senha
│   ├── Login.tsx                # Página de login
│   ├── MinhasReceitas.tsx       # Listagem de receitas
│   ├── NovaReceita.tsx          # Criação de receitas
│   ├── Register.tsx             # Cadastro de usuários
│   └── VisualizarReceita.tsx    # Visualização de receitas
├── services/          # Serviços e configurações
│   ├── firebase.ts              # Configuração Firebase
│   ├── firestore.ts             # Operações Firestore
│   └── toast.ts                 # Sistema de notificações
├── styles/            # Estilos CSS
│   └── animations.css           # Animações customizadas
├── types/             # Definições TypeScript
│   └── firestore.ts             # Tipos do Firestore
└── utils/             # Utilitários diversos
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 🎯 Funcionalidades

### 🔐 Autenticação e Segurança

- ✅ **Login** com email e senha
- ✅ **Registro** de novos usuários
- ✅ **Recuperação de senha** via email
- ✅ **Logout** seguro
- ✅ **Rotas protegidas**
- ✅ **Criação automática** de perfil de usuário

### 📊 Gestão de Receitas

- ✅ **Criação de receitas** com ingredientes detalhados
- ✅ **Cálculo automático de custos** (ingredientes + mão de obra + overhead)
- ✅ **Precificação inteligente** com margem de lucro configurável
- ✅ **Análise de lucratividade** por receita
- ✅ **Categorização** de receitas (doces, salgados, bebidas, etc.)
- ✅ **Sistema de tags** para organização
- ✅ **Controle de porções** e rendimento

### 💾 Sistema de Rascunhos

- ✅ **Salvamento automático** de receitas incompletas
- ✅ **Gestão de rascunhos** com preview e carregamento
- ✅ **Histórico de modificações** com timestamps
- ✅ **Recuperação de dados** não salvos

### 📈 Dashboard e Relatórios

- ✅ **Painel estatístico** com métricas importantes
- ✅ **Receitas mais lucrativas** em destaque
- ✅ **Análise de custos médios** e margens
- ✅ **Contador de receitas** por usuário
- ✅ **Cards informativos** com ações rápidas

### 🎨 Interface e UX

- ✅ **Design responsivo** para todos os dispositivos
- ✅ **Sistema de toasts** para feedback visual
- ✅ **Loading states** com spinners e skeleton loaders
- ✅ **Confirmações modais** para ações destrutivas
- ✅ **Animações suaves** e micro-interações
- ✅ **Validação em tempo real** dos formulários
- ✅ **Mensagens de erro** informativas e contextuais
- ✅ **Autocomplete** para ingredientes comuns
- ✅ **Progresso visual** em formulários multi-etapa

### 🔧 Ferramentas de Desenvolvimento

- ✅ **Página de diagnóstico** Firebase integrada
- ✅ **Logs detalhados** para debugging
- ✅ **Tratamento robusto de erros** com fallbacks
- ✅ **Validação de conectividade** automática
- ✅ **Sistema de backup** de dados importantes

## 🛠️ Configuração do Firebase

### 1. Configuração Básica

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative a **Authentication** e configure **Email/Password**
4. Acesse **Project Settings** > **General** > **Your apps**
5. Adicione um app web e copie as credenciais
6. Cole as credenciais no arquivo `.env`

### 2. Configuração do Firestore

1. Vá em **Firestore Database** > **Criar banco de dados**
2. Escolha **Modo de produção** ou **Modo de teste**
3. Selecione uma região próxima (ex: `southamerica-east1`)
4. Copie as regras de segurança do arquivo `firestore.rules`
5. Cole as regras em **Firestore** > **Regras** e publique

### 3. Estrutura do Banco de Dados

O Firestore será organizado automaticamente com as seguintes coleções:

- `users/{userId}` - Perfis e configurações dos usuários
- `recipes/{recipeId}` - Receitas com custos e precificação
- `drafts/{draftId}` - Rascunhos de receitas não finalizadas

### 4. Diagnóstico e Solução de Problemas

Se encontrar problemas de conectividade:

1. Acesse `/firestore-debug` na aplicação
2. Execute o diagnóstico completo
3. Verifique os logs do console do navegador

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

### Deploy no Firebase Hosting (opcional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ por Davyd Fontoura

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor:

- Abra uma [issue](../../issues)
- Entre em contato via email

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
