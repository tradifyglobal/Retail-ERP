import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { inventoryService, posService } from '../services/services';
import useAuthStore from '../context/authStore';

const POS = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await inventoryService.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    try {
      const response = await posService.createSale({
        invoiceNumber: `INV-${Date.now()}`,
        items: cart,
        paymentMethod,
        totalAmount: calculateTotal(),
        discount
      });

      if (response.data.success) {
        toast.success('Sale completed successfully');
        setCart([]);
        setDiscount(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sale failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t('pos.title')}
        </h1>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.filter(p => p.isActive).map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
            >
              <div className="font-semibold text-gray-800 text-sm">{product.name}</div>
              <div className="text-sm text-gray-600 mt-1">{product.category}</div>
              <div className="text-lg font-bold text-blue-600 mt-2">
                ${parseFloat(product.sellingPrice).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Stock: {product.quantity}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t('pos.cart')}
        </h2>

        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between border-b pb-4">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    ${item.price} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="space-y-3 border-t pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder={t('pos.discount')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>{t('pos.total')}:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="cash">{t('pos.cash')}</option>
                <option value="card">{t('pos.card')}</option>
                <option value="cheque">Cheque</option>
              </select>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                {t('pos.checkout')}
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition-colors"
              >
                {t('pos.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default POS;
