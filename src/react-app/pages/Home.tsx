import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { 
  ChefHat, 
  Calculator, 
  BarChart3, 
  Store, 
  Loader2,
  LogOut 
} from "lucide-react";

export default function Home() {
  const { user, isPending, redirectToLogin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect based on user role
    if (user && (user as any)?.profile) {
      const role = (user as any).profile.role;
      switch (role) {
        case 'owner':
          navigate('/dashboard');
          break;
        case 'cashier':
          navigate('/pos');
          break;
        case 'chef':
          navigate('/kitchen');
          break;
      }
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-8 shadow-lg">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              Miyagi Noodle
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              Complete Point of Sale system untuk bisnis F&B. Kelola pesanan, inventori, dan laporan keuangan dengan mudah.
            </p>
            
            <button
              onClick={redirectToLogin}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Store className="w-6 h-6 mr-3" />
              Masuk dengan Google
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Owner Dashboard</h3>
              <p className="text-gray-600">
                Monitor penjualan, profit, inventori, dan analisis bisnis lengkap dalam satu dashboard.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Kasir (POS)</h3>
              <p className="text-gray-600">
                Interface kasir yang intuitif untuk dine-in dan takeaway dengan berbagai metode pembayaran.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Kitchen Display</h3>
              <p className="text-gray-600">
                Tampilan dapur yang bersih untuk melihat pesanan masuk dan mengupdate status masakan.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userRole = (user as any)?.profile?.role;
  const userName = (user as any)?.profile?.name || user.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-8 shadow-lg">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Selamat Datang, {userName}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Role: <span className="font-semibold capitalize">{userRole}</span>
          </p>
          
          <button
            onClick={logout}
            className="inline-flex items-center px-6 py-3 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {(userRole === 'owner' || userRole === 'cashier') && (
            <button
              onClick={() => navigate('/pos')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Point of Sale</h3>
              <p className="text-gray-600">
                Buat pesanan baru dan kelola pembayaran
              </p>
            </button>
          )}

          {userRole === 'owner' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Dashboard</h3>
              <p className="text-gray-600">
                Monitor penjualan dan analisis bisnis
              </p>
            </button>
          )}

          {(userRole === 'chef' || userRole === 'owner') && (
            <button
              onClick={() => navigate('/kitchen')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Kitchen Display</h3>
              <p className="text-gray-600">
                Lihat pesanan masuk dan update status
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
