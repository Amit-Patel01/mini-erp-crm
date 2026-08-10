import React, { useEffect, useState } from 'react';
import { productApi, stockApi } from '../services/api';
import type { Product, StockMovement, MovementType } from '../types';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Layers,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add/Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics & Hardware',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 5,
    warehouse: 'Main Warehouse A',
  });

  // Stock Adjustment Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 10,
    movementType: 'IN' as MovementType,
    reason: 'Manual Warehouse Adjustment',
  });
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts({
        search,
        category: categoryFilter,
        lowStock: lowStockOnly,
      });
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await stockApi.getStockMovements();
      if (res.success && res.data) {
        setMovements(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [activeTab, search, categoryFilter, lowStockOnly]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics & Hardware',
      unitPrice: 1000,
      currentStock: 10,
      minimumStock: 5,
      warehouse: 'Main Warehouse A',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      warehouse: p.warehouse,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, productForm);
      } else {
        await productApi.createProduct(productForm);
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productApi.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleOpenAdjustStock = (p: Product) => {
    setSelectedProduct(p);
    setStockForm({
      quantity: 10,
      movementType: 'IN',
      reason: 'Manual Stock Entry',
    });
    setStockModalOpen(true);
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setStockSubmitting(true);
    try {
      const res = await stockApi.adjustStock({
        productId: selectedProduct.id,
        quantity: Number(stockForm.quantity),
        movementType: stockForm.movementType,
        reason: stockForm.reason,
      });
      if (res.success) {
        setStockModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setStockSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Inventory & Stock</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Product catalog, real-time stock balances, low-stock threshold alerts, and movement audit logs.
          </p>
        </div>
        <button
          onClick={handleOpenAddProduct}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product SKU</span>
        </button>
      </div>

      {/* Primary View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inventory Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit Log</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Inventory Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU or Product Name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Categories</option>
                <option value="Electronics & Hardware">Electronics & Hardware</option>
                <option value="Consumables">Consumables</option>
              </select>

              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  lowStockOnly
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

          {/* Product Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading inventory catalog...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No products match current filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-4">SKU</th>
                      <th className="p-4">Product Name & Category</th>
                      <th className="p-4 text-right">Unit Price</th>
                      <th className="p-4 text-center">Stock Level</th>
                      <th className="p-4">Warehouse Location</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const isLowStock = p.currentStock <= p.minimumStock;
                      return (
                        <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.category}</div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-900">
                            ₹{p.unitPrice.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`font-mono font-black text-sm ${
                                  isLowStock ? 'text-amber-700' : 'text-emerald-700'
                                }`}
                              >
                                {p.currentStock} units
                              </span>
                              {isLowStock ? (
                                <Badge variant="amber">Low Stock (&le; {p.minimumStock})</Badge>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Min: {p.minimumStock}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-700">{p.warehouse}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenAdjustStock(p)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adjust Stock</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Stock Movement Audit Log View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
            Audit Log of Inventory Inward & Outward Movements
          </div>
          {movements.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No stock movement logs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Movement</th>
                    <th className="p-4">Product</th>
                    <th className="p-4 text-center">Quantity</th>
                    <th className="p-4">Reason / Reference</th>
                    <th className="p-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Badge variant={m.movementType === 'IN' ? 'success' : 'danger'}>
                          {m.movementType === 'IN' ? 'INWARD (+)' : 'OUTWARD (-)'}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {m.product?.name || 'N/A'} ({m.product?.sku})
                      </td>
                      <td className="p-4 text-center font-mono font-black text-sm">
                        {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{m.reason}</td>
                      <td className="p-4 text-slate-500 font-medium">{m.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
              <input
                type="text"
                required
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Minimum Stock Alert Level *
              </label>
              <input
                type="number"
                min="1"
                required
                value={productForm.minimumStock}
                onChange={(e) => setProductForm({ ...productForm, minimumStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            {!editingProduct && (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Initial Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.currentStock}
                  onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Warehouse Location
              </label>
              <input
                type="text"
                required
                value={productForm.warehouse}
                onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30"
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Adjust Stock Level: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleSaveStockAdjustment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStockForm({ ...stockForm, movementType: 'IN' })}
                className={`py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stockForm.movementType === 'IN'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-300'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Stock IN (Inward)</span>
              </button>
              <button
                type="button"
                onClick={() => setStockForm({ ...stockForm, movementType: 'OUT' })}
                className={`py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stockForm.movementType === 'OUT'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-600 border-slate-300'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Stock OUT (Outward)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Quantity Units *</label>
            <input
              type="number"
              min="1"
              required
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Mandatory Reason / Reference *
            </label>
            <input
              type="text"
              required
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              placeholder="e.g. Supplier Inward / Damage Removal"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stockSubmitting}
              className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
            >
              {stockSubmitting ? 'Recording...' : 'Commit Stock Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
