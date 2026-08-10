import React, { useEffect, useState } from 'react';
import { challanApi, customerApi, productApi } from '../services/api';
import type { Challan, Customer, Product } from '../types';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  X,
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const ChallansPage: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Builder Drawer State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [submittingChallan, setSubmittingChallan] = useState(false);

  // View / Print Modal State
  const [viewChallan, setViewChallan] = useState<Challan | null>(null);

  // Insufficient Stock Error Modal State
  const [stockErrorData, setStockErrorData] = useState<{
    message: string;
    available?: number;
    requested?: number;
  } | null>(null);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await challanApi.getChallans({
        status: statusFilter,
        search,
      });
      if (res.success && res.data) {
        setChallans(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [statusFilter, search]);

  const handleOpenBuilder = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerApi.getCustomers({ limit: 100 }),
        productApi.getProducts({ limit: 100 }),
      ]);
      if (custRes.data) setCustomersList(custRes.data);
      if (prodRes.data) setProductsList(prodRes.data);
      if (custRes.data && custRes.data.length > 0) {
        setSelectedCustomerId(custRes.data[0].id);
      }
      setLineItems([{ productId: prodRes.data?.[0]?.id || '', quantity: 1 }]);
      setBuilderOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLineItem = () => {
    if (productsList.length === 0) return;
    setLineItems([...lineItems, { productId: productsList[0].id, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: 'productId' | 'quantity', val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const handleCreateChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    const validItems = lineItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one line item with quantity > 0');
      return;
    }

    setSubmittingChallan(true);
    setStockErrorData(null);
    try {
      const res = await challanApi.createChallan({
        customerId: selectedCustomerId,
        items: validItems,
        status,
      });
      if (res.success) {
        setBuilderOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      if (errRes && errRes.available !== undefined) {
        setStockErrorData({
          message: errRes.message,
          available: errRes.available,
          requested: errRes.requested,
        });
      } else {
        alert(errRes?.message || err.message || 'Failed to create challan');
      }
    } finally {
      setSubmittingChallan(false);
    }
  };

  const handleConfirmChallan = async (challan: Challan) => {
    if (!window.confirm(`Confirm Sales Challan ${challan.challanNumber}? This will deduct inventory stock.`)) {
      return;
    }
    setStockErrorData(null);
    try {
      const res = await challanApi.confirmChallan(challan.id);
      if (res.success) {
        fetchChallans();
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      if (errRes && errRes.available !== undefined) {
        setStockErrorData({
          message: errRes.message,
          available: errRes.available,
          requested: errRes.requested,
        });
      } else {
        alert(errRes?.message || err.message || 'Failed to confirm challan');
      }
    }
  };

  const handleCancelChallan = async (challan: Challan) => {
    if (
      !window.confirm(
        `Cancel Sales Challan ${challan.challanNumber}? If confirmed, product stock will be restocked.`
      )
    ) {
      return;
    }
    try {
      const res = await challanApi.cancelChallan(challan.id);
      if (res.success) {
        fetchChallans();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel challan');
    }
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!viewChallan) return;
    const element = document.getElementById('printable-challan-invoice');
    if (!element) return;

    setIsDownloadingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));
      pdf.save(`Delivery_Challan_${viewChallan.challanNumber}.pdf`);
    } catch (err: any) {
      console.error('Direct PDF export error:', err);
      const prevTitle = document.title;
      document.title = `Delivery_Challan_${viewChallan.challanNumber}`;
      window.print();
      document.title = prevTitle;
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Calculate live preview total in builder
  const productMap = new Map(productsList.map((p) => [p.id, p]));
  const builderTotalAmount = lineItems.reduce((sum, item) => {
    const p = productMap.get(item.productId);
    return sum + (p ? p.unitPrice * (item.quantity || 0) : 0);
  }, 0);

  const builderTotalQty = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Delivery Challans</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Auto-numbering challan creation (`CH-2026-XXXX`), price snapshotting, printable tax invoices, and transactional inventory lock.
          </p>
        </div>
        <button
          onClick={handleOpenBuilder}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Sales Challan</span>
        </button>
      </div>

      {/* Status Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Challan # or Customer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading sales challans...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No challans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4">Challan Number</th>
                  <th className="p-4">Customer Name & Business</th>
                  <th className="p-4 text-center">Total Line Items</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{c.challanNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.customer?.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{c.customer?.businessName}</div>
                    </td>
                    <td className="p-4 text-center text-slate-700 font-semibold">
                      {c.items?.length || 0} line items ({c.totalQuantity} pcs)
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 text-sm">
                      ₹{c.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          c.status === 'CONFIRMED'
                            ? 'success'
                            : c.status === 'DRAFT'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewChallan(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Invoice</span>
                        </button>

                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleConfirmChallan(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {c.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelChallan(c)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Cancel Challan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Create Challan Builder */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setBuilderOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 h-full p-6 overflow-y-auto flex flex-col z-10 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Create New Sales Delivery Challan</h3>
                <p className="text-xs text-indigo-600 font-bold">Sequential Auto-numbering will be generated</p>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Selection */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Customer Account *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
              >
                {customersList.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.customerName} - {cust.businessName} ({cust.customerType})
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items Section */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Challan Line Items
                </h4>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, idx) => {
                  const prod = productMap.get(item.productId);
                  const isStockWarning = prod && prod.currentStock < item.quantity;
                  const rowSubtotal = prod ? prod.unitPrice * (item.quantity || 0) : 0;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                        isStockWarning
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Product Item
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateLineItem(idx, 'productId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                          >
                            {productsList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - Stock: {p.currentStock} pcs @ ₹{p.unitPrice}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Qty (Pcs)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateLineItem(idx, 'quantity', Number(e.target.value))
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div className="w-28 text-right self-end pb-2">
                          <div className="text-[10px] text-slate-500 font-medium">Subtotal</div>
                          <div className="font-bold text-xs text-slate-900">
                            ₹{rowSubtotal.toLocaleString()}
                          </div>
                        </div>

                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 self-end mb-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isStockWarning && (
                        <div className="text-[11px] text-amber-800 flex items-center gap-1.5 font-bold pt-1 border-t border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                          <span>
                            Warning: Stock available ({prod.currentStock} units) is less than requested ({item.quantity} units). Confirmation will fail transactionally!
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary & Submit Action Footer */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Total Quantity:</span>
                <span className="font-bold text-slate-900">{builderTotalQty} Pcs</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-700">Grand Total Amount:</span>
                <span className="font-black text-indigo-700 text-lg">
                  ₹{builderTotalAmount.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingChallan}
                  onClick={() => handleCreateChallan('DRAFT')}
                  className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Save as DRAFT</span>
                </button>

                <button
                  type="button"
                  disabled={submittingChallan}
                  onClick={() => handleCreateChallan('CONFIRMED')}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Deduct Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Stock Error Modal */}
      <Modal
        isOpen={!!stockErrorData}
        onClose={() => setStockErrorData(null)}
        title="Stock Lock Transaction Failed"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-rose-900">Insufficient Inventory Stock</div>
              <p className="mt-1 font-medium leading-relaxed">{stockErrorData?.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Available Stock</span>
              <span className="text-lg font-mono font-black text-emerald-700">
                {stockErrorData?.available} units
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Requested Stock</span>
              <span className="text-lg font-mono font-black text-rose-700">
                {stockErrorData?.requested} units
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-[11px] font-medium">
            The database transaction was aborted completely. Stock levels remain untouched.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStockErrorData(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Close Alert
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Invoice / Delivery Challan Modal */}
      {viewChallan && (
        <Modal
          isOpen={!!viewChallan}
          onClose={() => setViewChallan(null)}
          title={`Delivery Challan - ${viewChallan.challanNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top Toolbar Actions */}
            <div className="flex items-center justify-between no-print border-b border-slate-200 pb-4">
              <Badge
                variant={
                  viewChallan.status === 'CONFIRMED'
                    ? 'success'
                    : viewChallan.status === 'DRAFT'
                    ? 'warning'
                    : 'danger'
                }
              >
                Status: {viewChallan.status}
              </Badge>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPDF ? 'Downloading PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Challan</span>
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div id="printable-challan-invoice" className="printable-area p-8 bg-white text-slate-900 rounded-xl space-y-6 border border-slate-200">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div className="flex items-start gap-4">
                  <img src="/logo.png" alt="Nexus Logo" crossOrigin="anonymous" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h2 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
                      NEXUS WHOLESALE DISTRIBUTORS
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Plot 120, Freight Logistics Park, Industrial Area Phase II, Mumbai
                    </p>
                    <p className="text-xs text-slate-600">GSTIN: 27AAAAA1234A1Z0 | Phone: +91 98765 00000</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    DELIVERY CHALLAN
                  </div>
                  <div className="text-xl font-mono font-black text-indigo-700 mt-1">
                    {viewChallan.challanNumber}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Date: {new Date(viewChallan.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Billed To / Consignee */}
              <div className="grid grid-cols-2 gap-8 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Consignee / Customer Details:
                  </h4>
                  <div className="font-bold text-sm text-slate-900">
                    {viewChallan.customer?.businessName}
                  </div>
                  <div className="text-slate-700 mt-1">Contact: {viewChallan.customer?.customerName}</div>
                  <div className="text-slate-700">Phone: {viewChallan.customer?.mobile}</div>
                  <div className="text-slate-700 mt-1">Address: {viewChallan.customer?.address}</div>
                  {viewChallan.customer?.gstNumber && (
                    <div className="font-mono font-semibold text-slate-800 mt-1">
                      GSTIN: {viewChallan.customer?.gstNumber}
                    </div>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div className="text-slate-600">
                    Challan Status: <span className="font-bold text-slate-900">{viewChallan.status}</span>
                  </div>
                  <div className="text-slate-600">
                    Issued By: <span className="font-bold text-slate-900">{viewChallan.createdBy}</span>
                  </div>
                  <div className="text-slate-600">Dispatch Via: Road Freight Transport</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-800 font-bold uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Product Particulars</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewChallan.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                      <td className="py-2.5 px-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{(item.unitPrice * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t-2 border-slate-900">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Quantity:</span>
                    <span className="font-bold text-slate-900">{viewChallan.totalQuantity} Units</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{viewChallan.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-300 text-xs text-center text-slate-600">
                <div>
                  <div className="h-12 border-b border-slate-400 border-dashed" />
                  <span className="block mt-2 font-medium">Receiver's Signature & Stamp</span>
                </div>
                <div>
                  <div className="h-12 border-b border-slate-400 border-dashed" />
                  <span className="block mt-2 font-medium">For NEXUS WHOLESALE DISTRIBUTORS</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
