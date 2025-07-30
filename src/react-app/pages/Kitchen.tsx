import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Home,
  LogOut,
  Utensils,
  Package
} from "lucide-react";
import type { OrderItem } from "@/shared/types";

interface KitchenOrderItem extends OrderItem {
  order_number: string;
  order_type: 'dine_in' | 'takeaway';
  table_number?: number;
  created_at: string;
}

export default function Kitchen() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState<KitchenOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKitchenOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchKitchenOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchKitchenOrders = async () => {
    try {
      const response = await fetch('/api/kitchen/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (itemId: number, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch(`/api/kitchen/orders/${itemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === itemId 
              ? { ...order, kitchen_status: status }
              : order
          ).filter(order => status !== 'completed' || order.id !== itemId)
        );
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupOrdersByOrderNumber = (orders: KitchenOrderItem[]) => {
    const grouped = orders.reduce((acc, order) => {
      if (!acc[order.order_number]) {
        acc[order.order_number] = [];
      }
      acc[order.order_number].push(order);
      return acc;
    }, {} as Record<string, KitchenOrderItem[]>);

    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  const groupedOrders = groupOrdersByOrderNumber(orders);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Kitchen Display System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchKitchenOrders}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Refresh
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter(o => o.kitchen_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center">
              <PlayCircle className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter(o => o.kitchen_status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        {Object.keys(groupedOrders).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedOrders).map(([orderNumber, orderItems]) => {
              const firstItem = orderItems[0];
              return (
                <div key={orderNumber} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{orderNumber}</h3>
                      <div className="flex items-center mt-1">
                        {firstItem.order_type === 'dine_in' ? (
                          <>
                            <Utensils className="w-4 h-4 text-blue-600 mr-1" />
                            <span className="text-sm text-blue-600">
                              Dine In - Meja {firstItem.table_number}
                            </span>
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-sm text-green-600">Takeaway</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTime(firstItem.created_at)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.product_name}
                              {item.variant_name && ` - ${item.variant_name}`}
                            </h4>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            {item.notes && (
                              <p className="text-sm text-orange-600 italic">Note: {item.notes}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.kitchen_status)}`}>
                            {getStatusIcon(item.kitchen_status)}
                            <span className="ml-1 capitalize">{item.kitchen_status.replace('_', ' ')}</span>
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-3">
                          {item.kitchen_status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(item.id, 'in_progress')}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Start Cooking
                            </button>
                          )}
                          {item.kitchen_status === 'in_progress' && (
                            <button
                              onClick={() => updateOrderStatus(item.id, 'completed')}
                              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-500">Semua pesanan sudah selesai atau belum ada pesanan baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}
