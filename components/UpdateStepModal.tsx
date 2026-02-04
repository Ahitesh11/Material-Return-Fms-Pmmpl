import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Save, Loader2, Info, Search, Calendar, 
  Truck, Package, FileText, Send, AlertCircle,
  CheckCircle, CreditCard, User, Hash, DollarSign
} from 'lucide-react';
import { FmsData, WorkflowStep, OrderResponse } from '../types';
import FileUpload from './FileUpload';
import { BACKEND_URL } from '../App';

declare const google: any;

interface UpdateStepModalProps {
  row: FmsData;
  onClose: () => void;
  onSave: () => void;
}

const UpdateStepModal: React.FC<UpdateStepModalProps> = ({ row, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [transporters, setTransporters] = useState<string[]>([]);
  const [fetchingTransporters, setFetchingTransporters] = useState(false);

  const getCurrentStep = (): WorkflowStep => {
    if (!row.actual1) return WorkflowStep.STEP_1;
    if (!row.actual2) return WorkflowStep.STEP_2;
    if (!row.actual3) return WorkflowStep.STEP_3;
    if (!row.actual4) return WorkflowStep.STEP_4;
    return WorkflowStep.COMPLETED;
  };

  const currentStep = getCurrentStep();
  const [formData, setFormData] = useState<any>({
    typeOfRate: 'Per MT',
    transporterName: '',
    sendToMail: 'No'
  });

  const loadTransporters = useCallback(async () => {
    if (currentStep !== WorkflowStep.STEP_1) return;
    setFetchingTransporters(true);
    
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((result: OrderResponse) => {
          setTransporters(result.transporters || []);
          setFetchingTransporters(false);
        })
        .withFailureHandler(() => {
          setFetchingTransporters(false);
        })
        .getOrderData();
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}?action=getOrderData`);
      const result = await response.json();
      setTransporters(result.transporters || []);
    } catch (err) {
      console.error('Failed to load transporters:', err);
    } finally {
      setFetchingTransporters(false);
    }
  }, [currentStep]);

  useEffect(() => {
    loadTransporters();
  }, [loadTransporters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fieldName: string, url: string) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on current step
    if (currentStep === WorkflowStep.STEP_1 && !formData.transporterName) {
      alert("Please select a transporter");
      return;
    }

    setLoading(true);
    
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(() => {
          setLoading(false);
          onSave();
          onClose();
        })
        .withFailureHandler((err: any) => {
          alert(`Update Error: ${err.message || 'Unknown error'}`);
          setLoading(false);
        })
        .updateWorkflowStep(row.rowId, currentStep, formData);
      return;
    }

    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ 
          action: 'updateWorkflowStep', 
          rowId: row.rowId, 
          stepNumber: currentStep, 
          data: formData 
        })
      });
      setTimeout(() => {
        setLoading(false);
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      alert("Failed to update. Please check your connection.");
      setLoading(false);
    }
  };

  const getStepConfig = () => {
    const configs = {
      [WorkflowStep.STEP_1]: {
        title: 'Step 1: Arrange Logistics',
        icon: Truck,
        color: 'blue',
        description: 'Enter transporter details and vehicle information'
      },
      [WorkflowStep.STEP_2]: {
        title: 'Step 2: Material Receiving',
        icon: Package,
        color: 'purple',
        description: 'Record returned material details and condition'
      },
      [WorkflowStep.STEP_3]: {
        title: 'Step 3: Credit Note Issuance',
        icon: FileText,
        color: 'green',
        description: 'Generate billing and credit note information'
      },
      [WorkflowStep.STEP_4]: {
        title: 'Step 4: Dispatch to Party',
        icon: Send,
        color: 'orange',
        description: 'Finalize and dispatch credit notes to party'
      },
    };
    return configs[currentStep] || { title: '', icon: Truck, color: 'blue', description: '' };
  };

  const stepConfig = getStepConfig();
  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500' },
  };

  const currentColor = colorClasses[stepConfig.color as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${currentColor.border} flex items-center justify-between bg-white`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentColor.bg}`}>
              <stepConfig.icon className={`w-5 h-5 ${currentColor.text}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{stepConfig.title}</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">
                {row.partyNames} • Return No: <span className="font-medium">{row.returnNo}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Info Banner */}
          <div className={`${currentColor.bg} border ${currentColor.border} p-4 mx-6 mt-6 rounded-lg flex items-start gap-3`}>
            <Info className={`${currentColor.text} mt-0.5 flex-shrink-0`} size={18} />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {stepConfig.description}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Timestamp will be recorded automatically upon submission.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-6">
            {currentStep === WorkflowStep.STEP_1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Transporter Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        Transporter Name
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <div className="relative">
                      <select 
                        required 
                        name="transporterName" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white appearance-none"
                        value={formData.transporterName}
                        onChange={handleInputChange}
                        disabled={fetchingTransporters}
                      >
                        <option value="">Select a transporter</option>
                        {transporters.map((transporter, index) => (
                          <option key={`${transporter}-${index}`} value={transporter}>
                            {transporter}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-3.5 text-gray-400">
                        {fetchingTransporters ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="vehicleNo" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter vehicle registration number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Bilty Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        Bilty Number
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <input 
                      required 
                      name="biltyNo" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter bilty number"
                    />
                  </div>

                  {/* Received Date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Received Date
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <input 
                      required 
                      type="date" 
                      name="receivedDate" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Rate Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Rate Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Rate Type</label>
                      <select 
                        name="typeOfRate" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        onChange={handleInputChange}
                        value={formData.typeOfRate}
                      >
                        <option value="Per MT">Per Metric Ton</option>
                        <option value="Fixed">Fixed Amount</option>
                      </select>
                    </div>

                    {formData.typeOfRate === 'Per MT' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            Rate per Metric Ton
                            <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <input 
                          required 
                          name="perMatricTonRate" 
                          type="number" 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          onChange={handleInputChange}
                          placeholder="Enter rate per metric ton"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            Fixed Amount
                            <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <input 
                          required 
                          name="fixedAmount" 
                          type="number" 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          onChange={handleInputChange}
                          placeholder="Enter fixed amount"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === WorkflowStep.STEP_2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity of Returned Material
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="qtyOfReturnMaterial" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="e.g., 10 MT, 25 Units"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Material Rate
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="rateOfMaterial" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter rate per unit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Material Condition
                  </label>
                  <input 
                    name="conditionOfMaterial" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    onChange={handleInputChange}
                    placeholder="Describe material condition (Good, Damaged, etc.)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Party Debit Note / Bill Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="partyDebitNoteNo" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter document number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Material Return Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="materialReturnNo" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter return number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FileUpload 
                      label="Bilty Copy / Photo"
                      onUpload={(url) => handleFileUpload('photoOfReturnMaterial', url)}
                      description="Upload bilty copy or material photo"
                    />
                  </div>
                  <div>
                    <FileUpload 
                      label="Original Bill Image"
                      onUpload={(url) => handleFileUpload('originalBillImage', url)}
                      description="Upload original bill or invoice"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === WorkflowStep.STEP_3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bill Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="billNo" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      onChange={handleInputChange}
                      placeholder="Enter bill number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">₹</span>
                      <input 
                        required 
                        type="number" 
                        name="amount" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                        onChange={handleInputChange}
                        placeholder="Enter total amount"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Credit Note Number
                    <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    name="creditNoteNo" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                    onChange={handleInputChange}
                    placeholder="Enter credit note number"
                  />
                </div>

                <div className="space-y-2">
                  <FileUpload 
                    label="Credit Note Copy"
                    onUpload={(url) => handleFileUpload('creditNoteCopy', url)}
                    description="Upload scanned copy of credit note"
                  />
                </div>
              </div>
            )}

            {currentStep === WorkflowStep.STEP_4 && (
              <div className="space-y-5">
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Send className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Dispatch Credit Note to Party</h4>
                      <p className="text-sm text-gray-500">Final step in the workflow process</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email Status
                        <span className="text-red-500">*</span>
                      </label>
                      <select 
                        required 
                        name="sendToMail" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white"
                        value={formData.sendToMail} 
                        onChange={handleInputChange}
                      >
                        <option value="No">Not Sent - Process Manually</option>
                        <option value="Yes">Sent to Party Email</option>
                      </select>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">
                          Selecting "Yes" will mark this workflow as completed. All documentation should be verified before finalizing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row gap-3">
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
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {currentStep === WorkflowStep.STEP_4 ? 'Complete Workflow' : 'Save & Continue'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStepModal;