'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, Search, Info, AlertTriangle, RefreshCw, Package, Truck, User, Hash } from 'lucide-react';
import { OrderData, FmsData } from '../types';
import FileUpload from './FileUpload';
import { BACKEND_URL } from '../App';

declare const google: any;

interface NewEntryFormProps {
  onClose: () => void;
  onSave: () => void;
  existingData?: FmsData[];
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({ onClose, onSave, existingData = [] }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    doNumber: '',
    partyNames: '',
    productName: '',
    qty: '',
    transportPayment: 'To Pay',
    reasonOfMaterialReturn: '',
    debitNote: '',
  });

  // Fetch orders from backend
  const loadOrders = useCallback(async () => {
    setFetchingOrders(true);
    setFetchError(null);
    
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((result: any) => {
          const ordersList = (result?.orders) ? result.orders : (Array.isArray(result) ? result : []);
          setOrders(ordersList);
          setFetchingOrders(false);
        })
        .withFailureHandler(() => {
          setFetchError("Unable to connect to the server. Please check your connection.");
          setFetchingOrders(false);
        })
        .getOrderData();
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}?action=getOrderData`);
      const result = await response.json();
      const ordersList = (result?.orders) ? result.orders : (Array.isArray(result) ? result : []);
      setOrders(ordersList);
    } catch (err) {
      setFetchError("Network connection error. Please try again.");
      setOrders([]);
    } finally {
      setFetchingOrders(false);
    }
  }, []);

  // Generate next return number
  useEffect(() => {
    const safeExisting = Array.isArray(existingData) ? existingData : [];
    if (safeExisting.length > 0) {
      const numbers = safeExisting.map(d => {
        const match = (d.returnNo || '').match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      }).filter(n => n > 0);
      const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 1000) + 1;
      setFormData(prev => ({ ...prev, returnNo: `RET-${nextNum}` }));
    } else {
      setFormData(prev => ({ ...prev, returnNo: 'RET-1001' }));
    }
    loadOrders();
  }, [existingData, loadOrders]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.doNumber || !formData.debitNote) {
      alert("Please fill in all required fields including the Debit Note Image");
      return;
    }
    
    setLoading(true);
    
    // Native Google Apps Script submission
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(() => {
          setLoading(false);
          onSave();
          onClose();
        })
        .withFailureHandler((err: any) => {
          alert(`Submission error: ${err?.message || 'Failed to save data'}`);
          setLoading(false);
        })
        .addInitialEntry(formData);
      return;
    }

    // Remote API submission
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'addInitialEntry', data: formData })
      });
      setTimeout(() => {
        setLoading(false);
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      alert("Submission failed. Please check your deployment settings.");
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle DO number selection and auto-fill related fields
  const handleDoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDo = e.target.value;
    const order = orders.find(o => o.doNumber === selectedDo);
    
    if (order) {
      setFormData(prev => ({
        ...prev,
        doNumber: selectedDo,
        partyNames: order.partyNames || '',
        productName: order.productName || ''
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        doNumber: selectedDo, 
        partyNames: '', 
        productName: '' 
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">New Material Return Entry</h2>
                  <p className="text-sm text-gray-600 mt-1">Material Returned from Party</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {/* Error Alert */}
          {fetchError && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">{fetchError}</p>
                  <p className="text-xs text-orange-600 mt-1">Please refresh to try again</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={loadOrders}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-orange-600"
                disabled={fetchingOrders}
              >
                <RefreshCw className={`w-4 h-4 ${fetchingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-6">
            
            {/* Document Numbers Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3">
                      <Hash className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      readOnly 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900"
                      value={formData.returnNo}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Order Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3">
                      <Search className={`w-4 h-4 ${fetchingOrders ? 'animate-spin' : 'text-gray-400'}`} />
                    </div>
                    <select 
                      required 
                      name="doNumber"
                      disabled={fetchingOrders}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={formData.doNumber}
                      onChange={handleDoChange}
                    >
                      <option value="">
                        {fetchingOrders ? 'Loading orders...' : 'Select a DO number'}
                      </option>
                      {orders.map((order, index) => (
                        <option key={`${order.doNumber}-${index}`} value={order.doNumber}>
                          {order.doNumber} {order.partyNames ? `- ${order.partyNames}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Party & Product Information */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Party & Product Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    required 
                    readOnly 
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
                    value={formData.partyNames}
                    placeholder="Will be auto-filled when you select a DO number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      required 
                      readOnly 
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
                      value={formData.productName}
                      placeholder="Will be auto-filled when you select a DO number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      required 
                      name="qty"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                      placeholder="e.g., 50 MT, 100 Units"
                      value={formData.qty}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transport & Documentation */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Transport & Documentation
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Payment Type
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select 
                      required 
                      name="transportPayment"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm cursor-pointer"
                      value={formData.transportPayment}
                      onChange={handleInputChange}
                    >
                      {/* <option value="To Pay">To Pay</option> */}
                      <option value="Paid">Paid</option>
                      <option value="Ex factory">Ex factory</option>
                      <option value="For">For</option>
                    </select>
                  </div>

                  <div>
                    <FileUpload 
                      label="Upload Debit Note"
                      required={true}
                      description="Upload image or PDF of debit note"
                      onUpload={(url) => setFormData(prev => ({...prev, debitNote: url}))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Material Return
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea 
                    required 
                    name="reasonOfMaterialReturn"
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
                    placeholder="Please provide detailed reason for material return..."
                    value={formData.reasonOfMaterialReturn}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-gray-100 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.doNumber || !formData.debitNote}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Entry...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Material Return Entry
                </>
              )}
            </button>
          </div>
          
          {/* Required Fields Note */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Info className="w-3 h-3 mr-2" />
              <p>Fields Marked With <span className="text-red-500">*</span> Are Required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEntryForm;