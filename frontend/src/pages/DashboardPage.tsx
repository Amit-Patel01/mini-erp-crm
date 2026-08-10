import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, stockApi } from '../services/api';
import type { DashboardStats, Product } from '../types';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import {
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Adjustment Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Stock Replenishment');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQty(10);
    setAdjustReason('Stock Replenishment from Alert');
    setStockModalOpen(true);
  };

  const handleQuickAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustSubmitting(true);
    try {
      const res = await stockApi.adjustStock({
        productId: selectedProduct.id,
        quantity: Number(adjustQty),
        movementType: 'IN',
        reason: adjustReason,
      });
      if (res.success) {
        setStockModalOpen(false);
        fetchStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Operational Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
        <span className="font-semibold text-sm">{error || 'Failed to load dashboard statistics'}</span>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = stats?.metrics || (stats as any)?.summary || {
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    draftChallans: 0,
    confirmedChallans: 0,
    todayFollowUpsCount: 0,
    totalRevenue: 0,
  };

  const lowStockProducts = stats?.lowStockProducts || (stats as any)?.lowStockAlerts || [];
  const followUpsDueToday = stats?.followUpsDueToday || (stats as any)?.todaysFollowUps || [];
  const recentChallans = stats?.recentChallans || [];
  const recentStockMovements = stats?.recentStockMovements || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Operations Control Center</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time wholesale metrics, stock alerts, CRM follow-ups, and transactional challan activity.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-xs font-bold text-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-indigo-600" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="glass-card rounded-2xl p-5 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Customers
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{metrics.totalCustomers}</span>
            <span className="text-xs text-indigo-600 font-bold">Active Accounts</span>
          </div>
        </div>

        {/* Metric 2: Inventory Items */}
        <div
          onClick={() => navigate('/products')}
          className="glass-card rounded-2xl p-5 hover:border-sky-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inventory SKUs
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{metrics.totalProducts}</span>
            <span className="text-xs text-sky-600 font-bold">Catalog Items</span>
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div
          onClick={() => navigate('/products')}
          className={`glass-card rounded-2xl p-5 border transition-all cursor-pointer group ${
            metrics.lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Low Stock Alerts
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-900">{metrics.lowStockCount}</span>
            <span className="text-xs text-amber-700 font-bold">Below Min Threshold</span>
          </div>
        </div>

        {/* Metric 4: Revenue & Challans */}
        <div
          onClick={() => navigate('/challans')}
          className="glass-card rounded-2xl p-5 hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmed Sales Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              ₹{metrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {metrics.confirmedChallans} Confirmed
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alert Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Low Stock Warning Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Low Stock Inventory Alerts</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Action required to prevent stockout</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">All inventory levels are optimal!</p>
              <p className="text-xs text-slate-500 mt-0.5">No products currently below minimum threshold.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{product.name}</span>
                      <span className="text-xs font-mono text-slate-500">({product.sku})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Warehouse: <span className="text-slate-800 font-semibold">{product.warehouse}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-800">
                        Current: {product.currentStock} units
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">Min required: {product.minimumStock}</div>
                    </div>
                    <button
                      onClick={() => handleOpenStockModal(product)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Replenish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CRM Follow-Ups Due Today Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">CRM Follow-ups Scheduled</h3>
            </div>
            <Badge variant="purple">{followUpsDueToday.length} Due</Badge>
          </div>

          {followUpsDueToday.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No follow-ups pending for today.</p>
              <p className="text-xs text-slate-500 mt-0.5">Check back later or schedule new lead calls.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUpsDueToday.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => navigate('/customers')}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">{customer.customerName}</span>
                    <Badge variant={customer.status === 'LEAD' ? 'warning' : 'success'}>
                      {customer.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-indigo-600 font-bold">{customer.businessName}</div>
                  {customer.notes && (
                    <div className="text-xs text-slate-600 mt-1.5 italic line-clamp-2">
                      "{customer.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Sales Challans Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Recent Sales Challans</h3>
            <button
              onClick={() => navigate('/challans')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3">Challan #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentChallans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-600">{challan.challanNumber}</td>
                    <td className="p-3 font-bold text-slate-800">
                      {challan.customer?.customerName || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{challan.totalQuantity} units</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ₹{challan.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          challan.status === 'CONFIRMED'
                            ? 'success'
                            : challan.status === 'DRAFT'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {challan.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log: Recent Stock Movements (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Stock Movement Audit Feed</h3>
            <span className="text-xs text-slate-500 font-medium">Live Inventory Log</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {recentStockMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 ${
                      movement.movementType === 'IN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {movement.movementType === 'IN' ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{movement.product?.name || 'Item'}</div>
                    <div className="text-slate-500 text-[11px] font-medium mt-0.5">{movement.reason}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-mono font-black ${
                      movement.movementType === 'IN' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {movement.movementType === 'IN' ? '+' : '-'}{movement.quantity} units
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">by {movement.createdBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stock Replenish Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Stock Inward: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleQuickAdjustStock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Quantity to Inward
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reason / Reference
            </label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
            >
              {adjustSubmitting ? 'Inwarding...' : 'Add to Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
