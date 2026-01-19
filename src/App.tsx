import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import Dashboard from './pages/Dashboard.tsx';
import NovaReceita from './pages/NovaReceita.tsx';
import MinhasReceitas from './pages/MinhasReceitas.tsx';
import VisualizarReceita from './pages/VisualizarReceita.tsx';
import EditarReceita from './pages/EditarReceita.tsx';
import FirestoreTest from './pages/FirestoreTest.tsx';
import FirestoreDebug from './pages/FirestoreDebug.tsx';
import FeedbackPage from './pages/FeedbackPage.tsx';
import FeedbackAdmin from './pages/FeedbackAdmin.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Rotas públicas (sem layout) */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/admin/feedback" element={<FeedbackAdmin />} />

          {/* Rotas protegidas (com layout) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nova-receita"
            element={
              <ProtectedRoute>
                <Layout>
                  <NovaReceita />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-receitas"
            element={
              <ProtectedRoute>
                <Layout>
                  <MinhasReceitas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receita/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <VisualizarReceita />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receita/:id/editar"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditarReceita />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/firestore-test"
            element={
              <ProtectedRoute>
                <Layout>
                  <FirestoreTest />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/firestore-debug"
            element={
              <ProtectedRoute>
                <Layout>
                  <FirestoreDebug />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
