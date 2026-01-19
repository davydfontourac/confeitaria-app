import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { authToast, handleFirebaseError } from '../services/toast';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const isAdmin = useIsAdmin();

  const handleLogout = async () => {
    try {
      await logout();
      authToast.logoutSuccess();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      handleFirebaseError(error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🧁</span>
              <h1 className="text-xl font-bold text-gray-900">
                WebApp Confeitaria
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/nova-receita"
              className="bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium btn-animated"
            >
              Nova Receita
            </Link>

<<<<<<< HEAD
=======
            {/* Admin Links */}
>>>>>>> feature/admin-separation
            {isAdmin && (
              <>
                <Link
                  to="/firestore-test"
                  className="text-gray-600 hover:text-orange-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                  title="Página de testes (apenas admin)"
                >
                  <span>🧪</span>
                  <span>Testes</span>
                </Link>
                <Link
                  to="/firestore-debug"
                  className="text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                  title="Debug do Firestore (apenas admin)"
                >
                  <span>🐛</span>
                  <span>Debug</span>
                </Link>
                <Link
                  to="/admin/feedback"
                  className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                  title="Feedback de usuários (apenas admin)"
                >
                  <span>💬</span>
                  <span>Feedback</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">Olá,</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>🚪</span>
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-3 space-y-2">
          <Link
            to="/dashboard"
            className="block text-gray-600 hover:text-blue-600 font-medium py-2"
          >
            Dashboard
          </Link>
          <Link
            to="/nova-receita"
            className="block bg-gradient-to-r from-pink-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium text-center"
          >
            Nova Receita
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
