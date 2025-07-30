import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { 
  Calculator, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Home,
  LogOut,
  Utensils,
  Package
} from "lucide-react";
import type { Product, ProductVariant } from "@/shared/types";

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  notes?: string;
}

export default function POS() {
  const { logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Record<number, ProductVariant[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
        
        // Fetch variants for each product
        for (const product of productsData) {
          const variantsResponse = await fetch(`/api/products/${product.id}/variants`);
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            setVariants(prev => ({ ...prev, [product.id]: variantsData }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const existingItemIndex = cart.findIndex(item => 
      item.product.id === product.id && 
      item.variant?.id === variant?.id
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { product, variant, quantity: 1 }]);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      const newCart = [...cart];
      newCart[index].quantity = newQuantity;
      setCart(newCart);
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      const price = item.variant ? item.variant.price : item.product.base_price;
      return total + (price * item.quantity);
    }, 0);
  };

  const createOrder = async () => {
    if (cart.length === 0) return;

    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      product_variant_id: item.variant?.id,
      quantity: item.quantity,
      unit_price: item.variant ? item.variant.price : item.product.base_price,
      notes: item.notes
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType,
          table_number: orderType === 'dine_in' ? tableNumber : undefined,
          items: orderItems
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Order berhasil dibuat! Order Number: ${result.orderNumber}`);
        setCart([]);
      } else {
        alert('Gagal membuat order');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Gagal membuat order');
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
          <Calculator className="w-12 h-12 animate-pulse text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading POS...</p>
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
              <Calculator className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
              </div>
              <div className="p-6">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map(product => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        
                        {variants[product.id] && variants[product.id].length > 0 ? (
                          <div className="space-y-2">
                            {variants[product.id].map(variant => (
                              <button
                                key={variant.id}
                                onClick={() => addToCart(product, variant)}
                                className="w-full flex justify-between items-center p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-sm font-medium">{variant.name}</span>
                                <span className="text-sm text-green-600 font-semibold">
                                  {formatCurrency(variant.price)}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                          >
                            <span className="text-sm font-medium text-green-800">Add to Cart</span>
                            <span className="text-sm text-green-600 font-semibold">
                              {formatCurrency(product.base_price)}
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada produk tersedia</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Current Order
                </h2>
              </div>
              
              <div className="p-6">
                {/* Order Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Order
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType('dine_in')}
                      className={`p-2 text-sm font-medium rounded-lg border ${
                        orderType === 'dine_in'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <Utensils className="w-4 h-4 mx-auto mb-1" />
                      Dine In
                    </button>
                    <button
                      onClick={() => setOrderType('takeaway')}
                      className={`p-2 text-sm font-medium rounded-lg border ${
                        orderType === 'takeaway'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <Package className="w-4 h-4 mx-auto mb-1" />
                      Takeaway
                    </button>
                  </div>
                </div>

                {/* Table Number for Dine In */}
                {orderType === 'dine_in' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Meja
                    </label>
                    <input
                      type="number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Cart Items */}
                <div className="space-y-3 mb-6">
                  {cart.length > 0 ? (
                    cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.product.name}
                            {item.variant && ` - ${item.variant.name}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.variant ? item.variant.price : item.product.base_price)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-6">Keranjang kosong</p>
                  )}
                </div>

                {/* Total */}
                {cart.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(getTotalAmount())}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={createOrder}
                      className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Buat Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
