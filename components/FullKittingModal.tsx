import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Info, AlertCircle } from 'lucide-react';
import { FmsData, FullKittingData } from '../types';
import FileUpload from './FileUpload';
import { BACKEND_URL } from '../App';

declare const google: any;

interface FullKittingModalProps {
  row: FmsData;
  kittingData: FullKittingData[];
  onClose: () => void;
  onSave: () => void;
}

const FullKittingModal: React.FC<FullKittingModalProps> = ({ row, kittingData, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'Yes' | 'No'>('Yes');
  
  // Clean currency symbols from row.amount to make it a valid number for the input
  const cleanAmount = row.amount ? row.amount.replace(/[^0-9.]/g, '') : '';

  const [formData, setFormData] = useState({
    paymentNumber: '',
    uniqueNumber: row.returnNo,
    status: 'Pending Payment',
    transporterName: row.transporterName || '',
    vehicleNumber: row.vehicleNo || '',
    fromLocation: row.partyNames || '',
    toLocation: '',
    materialLoadDetails: (row.productName || '') + ' - ' + (row.qty || ''),
    biltyNumber: row.biltyNo || '',
    rateType: row.typeOfRate || '',
    amount: cleanAmount,
    biltyImage: row.originalBillImage || '',
  });

  useEffect(() => {
    const year = new Date().getFullYear();
    const safeKittingData = Array.isArray(kittingData) ? kittingData : [];
    
    const existingNums = safeKittingData
      .map(d => {
        const parts = d.paymentNumber ? d.paymentNumber.split('-') : [];
        const lastPart = parts.length > 0 ? parts[parts.length - 1] : '0';
        return parseInt(lastPart);
      })
      .filter(n => !isNaN(n) && n > 0);

    const nextId = (existingNums.length > 0 ? Math.max(...existingNums) : 1000) + 1;
    setFormData(prev => ({ ...prev, paymentNumber: `PAY-${year}-${nextId}` }));
  }, [kittingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'No') {
      alert("Submission is restricted when status is 'No'. All options are hidden and workflow is locked.");
      return;
    }
    
    setLoading(true);
    const submissionData = { ...formData, status: 'Active Kitting' };
    
    const isNative = typeof google !== 'undefined' && google.script && google.script.run;
    if (isNative) {
      google.script.run
        .withSuccessHandler(() => { 
          setLoading(false); 
          onSave(); 
          onClose(); 
        })
        .withFailureHandler(() => { 
          setLoading(false); 
          alert("Failed to save data to Kitting FMS. Please try again."); 
        })
        .addKittingEntry(submissionData);
      return;
    }

    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'addKittingEntry', data: submissionData })
      });
      setTimeout(() => { 
        setLoading(false); 
        onSave(); 
        onClose(); 
      }, 1500);
    } catch (err) {
      setLoading(false);
      alert("Remote connection error. Please check your network connection.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Forward to Kitting</h2>
            <p className="text-xs font-medium text-gray-500 mt-1">Payment Initialization Process</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {/* Basic Information Section */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Payment Number (Auto-generated)</label>
                <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium text-blue-700">
                  {formData.paymentNumber || 'Generating...'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Unique Return Number</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                  {formData.uniqueNumber}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as 'Yes' | 'No')}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Kitting Details Section (Conditional) */}
          {status === 'Yes' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-5">
                <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
                  Kitting Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Transporter Name</label>
                    <input 
                      value={formData.transporterName} 
                      onChange={e => setFormData({...formData, transporterName: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                      placeholder="Enter transporter name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Vehicle Number</label>
                    <input 
                      value={formData.vehicleNumber} 
                      onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                      placeholder="Enter vehicle registration number" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-blue-600 flex items-center gap-1">
                      <Info size={12} />
                      From Location (Party Name)
                    </label>
                    <input 
                      required 
                      placeholder="Enter loading location" 
                      value={formData.fromLocation} 
                      onChange={e => setFormData({...formData, fromLocation: e.target.value})} 
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">To Location (Destination)</label>
                    <input 
                      required 
                      value={formData.toLocation} 
                      onChange={e => setFormData({...formData, toLocation: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                      placeholder="Enter destination" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Material Load Details</label>
                  <textarea 
                    rows={2} 
                    value={formData.materialLoadDetails} 
                    onChange={e => setFormData({...formData, materialLoadDetails: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" 
                    placeholder="Enter material and loading details"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Bilty Number</label>
                    <input 
                      value={formData.biltyNumber} 
                      onChange={e => setFormData({...formData, biltyNumber: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                      placeholder="Enter bilty number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Rate Type</label>
                    <input 
                      value={formData.rateType} 
                      onChange={e => setFormData({...formData, rateType: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                      placeholder="Enter rate type"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-blue-600">Total Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">₹</span>
                      <input 
                        type="number" 
                        required 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                        className="w-full pl-8 pr-4 py-3 border border-blue-200 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                        placeholder="0.00" 
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <FileUpload 
                  label="Upload Bilty Image / Dispatch Proof" 
                  onUpload={url => setFormData({...formData, biltyImage: url})} 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-gray-600 font-semibold mb-2">Kitting Process Locked</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Select 'Yes - Send to Kitting Process' in the status dropdown above to enable kitting entry fields.
              </p>
            </div>
          )}
        </form>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3.5 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all border border-gray-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit} 
            disabled={loading || status === 'No'} 
            className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating Record...
              </>
            ) : status === 'Yes' ? (
              <>
                <Save size={18} />
                Create Kitting Record
              </>
            ) : (
              'Kitting Locked'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullKittingModal;