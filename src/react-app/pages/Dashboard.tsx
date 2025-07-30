import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle,
  DollarSign,
  Package,
  Home,
  LogOut
} from "lucide-react";
import type { DashboardData } from "@/shared/types";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Home
              </a>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Selamat Datang, {(user as any)?.profile?.name || user?.email}
          </h2>
          <p className="text-gray-600">
            Berikut adalah ringkasan performa bisnis Miyagi Noodle hari ini.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Penjualan Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.todaySales?.total_sales || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.todaySales?.total_profit || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Order Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.todaySales?.total_orders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Top 5 Produk Terlaris Hari Ini
            </h3>
            {dashboardData?.topProducts && dashboardData.topProducts.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{product.total_sold} porsi</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada penjualan hari ini</p>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Stok Bahan Baku Menipis
            </h3>
            {dashboardData?.lowStockMaterials && dashboardData.lowStockMaterials.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.lowStockMaterials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-red-500 mr-3" />
                      <span className="font-medium text-gray-900">{material.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        {material.current_stock} {material.base_unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {material.minimum_stock} {material.base_unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-600 text-center py-8 flex items-center justify-center">
                <Package className="w-5 h-5 mr-2" />
                Semua stok aman
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
