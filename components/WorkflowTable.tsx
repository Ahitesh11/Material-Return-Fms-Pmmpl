'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, Eye, FileText, CheckCircle, ExternalLink, 
  ArrowRightLeft, Lock, Filter, ChevronRight, 
  Package, Truck, DollarSign, AlertCircle,
  Calendar, Building, User, Clock, FileCheck
} from 'lucide-react';
import { FmsData, FullKittingData, View, User as UserType } from '../types';
import UpdateStepModal from './UpdateStepModal';
import FullKittingModal from './FullKittingModal';
import PaymentUpdateModal from './PaymentUpdateModal';

interface WorkflowTableProps {
  data: FmsData[];
  kittingData?: FullKittingData[];
  onUpdate: () => void;
  activeStepFilter?: View;
  user: UserType;
}

type TableRow = FmsData | FullKittingData;
type ColumnDefinition = {
  key: string;
  label: string;
  width?: string;
  className?: string;
  render: (row: any) => React.ReactNode;
};

const WorkflowTable: React.FC<WorkflowTableProps> = ({ 
  data, 
  kittingData = [], 
  onUpdate, 
  activeStepFilter, 
  user 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<FmsData | null>(null);
  const [selectedKitRow, setSelectedKitRow] = useState<FullKittingData | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isKittingModalOpen, setIsKittingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Helper functions
  const isRowKitted = useCallback((returnNo: string) => {
    return kittingData.some(k => k.uniqueNumber === returnNo);
  }, [kittingData]);

  const getStepStatus = useCallback((row: FmsData) => {
    if (row.actual4) return { 
      label: 'Finalized', 
      color: 'bg-green-100 text-green-700 border-green-200',
      step: 'completed',
      current: null,
      icon: CheckCircle
    };
    if (row.actual3) return { 
      label: 'Step 4: Dispatch', 
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      step: 'step4', 
      current: 'step4',
      icon: Truck
    };
    if (row.actual2) return { 
      label: 'Step 3: Billing', 
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      step: 'step3', 
      current: 'step3',
      icon: FileCheck
    };
    if (row.actual1) return { 
      label: 'Step 2: Confirmation', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      step: 'step2', 
      current: 'step2',
      icon: Package
    };
    return { 
      label: 'Step 1: Transporter', 
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      step: 'step1', 
      current: 'step1',
      icon: User
    };
  }, []);

  // View configuration
  const isKittingView = activeStepFilter === 'kitting';
  const isExplorerView = activeStepFilter === 'table';
  const currentView = useMemo(() => {
    if (isKittingView) return 'kitting';
    if (isExplorerView) return 'explorer';
    return activeStepFilter || 'dashboard';
  }, [activeStepFilter, isKittingView, isExplorerView]);

  // Permission check
  const hasPermissionForStep = useCallback((step: string | null) => {
    if (!step) return false;
    const permissionMap: Record<string, boolean> = {
      'step1': user.permissions.step1,
      'step2': user.permissions.step2,
      'step3': user.permissions.step3,
      'step4': user.permissions.step4,
      'kitting': user.permissions.kitting
    };
    return permissionMap[step] || false;
  }, [user.permissions]);

  // Filter data
  const filteredData = useMemo(() => {
    const sourceData = isKittingView ? kittingData : data;
    
    return sourceData.filter((item: any) => {
      // Search filter
      const searchFields = [
        item.partyNames,
        item.transporterName,
        item.returnNo,
        item.paymentNumber,
        item.doNumber,
        item.productName,
        item.vehicleNo,
        item.vehicleNumber
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Step filter (only for FMS data)
      if (!isKittingView && !isExplorerView && activeStepFilter && activeStepFilter !== 'dashboard') {
        const status = getStepStatus(item as FmsData);
        return status.current === activeStepFilter;
      }

      return true;
    });
  }, [data, kittingData, searchTerm, activeStepFilter, isKittingView, isExplorerView, getStepStatus]);

  // Column configurations
  const kittingColumns: ColumnDefinition[] = useMemo(() => [
    { key: 'timestamp', label: 'Timestamp', width: '180px', render: (row) => (
      <div className="text-xs text-gray-500 font-mono">{row.timestamp}</div>
    )},
    { key: 'paymentNumber', label: 'Payment Number', width: '180px', render: (row) => (
      <div className="text-sm font-semibold text-blue-600">{row.paymentNumber}</div>
    )},
    { key: 'uniqueNumber', label: 'Return No.', width: '140px', render: (row) => (
      <div className="text-sm text-gray-700">{row.uniqueNumber}</div>
    )},
    { key: 'status', label: 'Status', width: '120px', render: (row) => {
      const isPaid = (row.status || '').toLowerCase().trim() === 'paid' || !!row.actual;
      return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
          isPaid 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
          {isPaid ? 'Paid' : row.status || 'Pending'}
        </div>
      );
    }},
    { key: 'transporterName', label: 'Transporter', width: '200px', render: (row) => (
      <div className="text-sm text-gray-700">{row.transporterName}</div>
    )},
    { key: 'vehicleNumber', label: 'Vehicle No.', width: '140px', render: (row) => (
      <div className="text-sm font-medium text-gray-900">{row.vehicleNumber}</div>
    )},
    { key: 'fromLocation', label: 'From', width: '200px', render: (row) => (
      <div className="text-sm text-gray-700">{row.fromLocation}</div>
    )},
    { key: 'toLocation', label: 'To', width: '200px', render: (row) => (
      <div className="text-sm text-gray-700">{row.toLocation}</div>
    )},
    { key: 'materialLoadDetails', label: 'Load Details', width: '300px', render: (row) => (
      <div className="text-sm text-gray-600 italic">{row.materialLoadDetails}</div>
    )},
    { key: 'biltyNumber', label: 'Bilty No.', width: '150px', render: (row) => (
      <div className="text-sm text-gray-700">{row.biltyNumber}</div>
    )},
    { key: 'rateType', label: 'Rate Type', width: '120px', render: (row) => (
      <div className="text-xs text-gray-500 font-medium">{row.rateType}</div>
    )},
    { key: 'amount', label: 'Amount', width: '140px', render: (row) => (
      <div className="text-sm font-semibold text-green-700">₹{row.amount}</div>
    )},
    { key: 'biltyImage', label: 'Bilty Image', width: '120px', render: (row) => (
      row.biltyImage ? (
        <a 
          href={row.biltyImage} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          title="View Bilty Image"
        >
          <Eye size={16} className="text-blue-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No image</span>
    )},
    { key: 'paymentForm', label: 'Payment Form', width: '120px', render: (row) => (
      row.paymentForm ? (
        <a 
          href={row.paymentForm} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          title="View Payment Form"
        >
          <FileText size={16} className="text-green-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No form</span>
    )},
  ], []);

  const explorerColumns: ColumnDefinition[] = useMemo(() => [
    { key: 'timestamp', label: 'Timestamp', width: '180px', render: (row) => (
      <div className="text-xs text-gray-500 font-mono">{row.timestamp}</div>
    )},
    { key: 'returnNo', label: 'Return No.', width: '140px', render: (row) => (
      <div className="text-sm font-semibold text-blue-600">{row.returnNo}</div>
    )},
    { key: 'doNumber', label: 'DO Number', width: '140px', render: (row) => (
      <div className="text-sm font-medium text-gray-700">{row.doNumber}</div>
    )},
    { key: 'partyNames', label: 'Party Name', width: '280px', render: (row) => (
      <div className="text-sm text-gray-700 truncate" title={row.partyNames}>
        {row.partyNames}
      </div>
    )},
    { key: 'productName', label: 'Product', width: '280px', render: (row) => (
      <div className="text-sm text-gray-700">{row.productName}</div>
    )},
    { key: 'qty', label: 'Quantity', width: '100px', render: (row) => (
      <div className="text-sm text-gray-600">{row.qty}</div>
    )},
    { key: 'transportPayment', label: 'Transport Payment', width: '160px', render: (row) => (
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
        row.transportPayment === 'Paid' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        {row.transportPayment}
      </div>
    )},
    { key: 'reasonOfMaterialReturn', label: 'Return Reason', width: '240px', render: (row) => (
      <div className="text-sm text-gray-600 italic truncate" title={row.reasonOfMaterialReturn}>
        {row.reasonOfMaterialReturn}
      </div>
    )},
    { key: 'debitNote', label: 'Debit Note', width: '120px', render: (row) => (
      row.debitNote ? (
        <a 
          href={row.debitNote} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          title="View Debit Note"
        >
          <Eye size={16} className="text-blue-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No image</span>
    )},
    { key: 'transporterName', label: 'Transporter', width: '240px', render: (row) => (
      <div className="text-sm text-gray-700">{row.transporterName}</div>
    )},
    { key: 'biltyNo', label: 'Bilty No.', width: '140px', render: (row) => (
      <div className="text-sm text-gray-700">{row.biltyNo}</div>
    )},
    { key: 'typeOfRate', label: 'Rate Type', width: '130px', render: (row) => (
      <div className="text-xs text-gray-500">{row.typeOfRate}</div>
    )},
    { key: 'perMatricTonRate', label: 'Per MT Rate', width: '130px', render: (row) => (
      <div className="text-sm text-gray-700">{row.perMatricTonRate}</div>
    )},
    { key: 'fixedAmount', label: 'Fixed Amount', width: '130px', render: (row) => (
      <div className="text-sm text-gray-700">{row.fixedAmount}</div>
    )},
    { key: 'vehicleNo', label: 'Vehicle No.', width: '160px', render: (row) => (
      <div className="text-sm font-medium text-gray-900">{row.vehicleNo}</div>
    )},
    { key: 'receivedDate', label: 'Received Date', width: '160px', render: (row) => (
      <div className="text-sm text-gray-700 flex items-center gap-1">
        <Calendar size={12} />
        {row.receivedDate}
      </div>
    )},
    { key: 'qtyOfReturnMaterial', label: 'Return Qty', width: '130px', render: (row) => (
      <div className="text-sm text-gray-700">{row.qtyOfReturnMaterial}</div>
    )},
    { key: 'rateOfMaterial', label: 'Material Rate', width: '130px', render: (row) => (
      <div className="text-sm text-gray-700">{row.rateOfMaterial}</div>
    )},
    { key: 'conditionOfMaterial', label: 'Condition', width: '160px', render: (row) => (
      <div className="text-sm text-gray-700">{row.conditionOfMaterial}</div>
    )},
    { key: 'photoOfReturnMaterial', label: 'Return Photo', width: '120px', render: (row) => (
      row.photoOfReturnMaterial ? (
        <a 
          href={row.photoOfReturnMaterial} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          title="View Return Photo"
        >
          <Eye size={16} className="text-blue-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No photo</span>
    )},
    { key: 'partyDebitNoteNo', label: 'Party Debit No.', width: '200px', render: (row) => (
      <div className="text-sm text-gray-700">{row.partyDebitNoteNo}</div>
    )},
    { key: 'materialReturnNo', label: 'Material Return No.', width: '200px', render: (row) => (
      <div className="text-sm text-gray-700">{row.materialReturnNo}</div>
    )},
    { key: 'originalBillImage', label: 'Bill Image', width: '120px', render: (row) => (
      row.originalBillImage ? (
        <a 
          href={row.originalBillImage} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          title="View Bill Image"
        >
          <Eye size={16} className="text-blue-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No image</span>
    )},
    { key: 'billNo', label: 'Bill No.', width: '160px', render: (row) => (
      <div className="text-sm text-gray-700">{row.billNo}</div>
    )},
    { key: 'amount', label: 'Amount', width: '160px', render: (row) => (
      <div className="text-sm font-semibold text-green-700">₹{row.amount}</div>
    )},
    { key: 'creditNoteCopy', label: 'Credit Note', width: '120px', render: (row) => (
      row.creditNoteCopy ? (
        <a 
          href={row.creditNoteCopy} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          title="View Credit Note"
        >
          <FileText size={16} className="text-green-600" />
        </a>
      ) : <span className="text-xs text-gray-400">No note</span>
    )},
    { key: 'creditNoteNo', label: 'Credit Note No.', width: '160px', render: (row) => (
      <div className="text-sm text-gray-700">{row.creditNoteNo}</div>
    )},
    { key: 'sendToMail', label: 'Mail Status', width: '110px', render: (row) => (
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
        row.sendToMail?.toLowerCase() === 'sent' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-700'
      }`}>
        {row.sendToMail || 'Not Sent'}
      </div>
    )},
  ], []);

  // Get columns based on view
  const getColumns = () => {
    if (isKittingView) return kittingColumns;
    if (isExplorerView) return explorerColumns;
    // For step-specific views, we can filter columns as needed
    return explorerColumns.filter(col => {
      const stepColumns = {
        'step1': ['returnNo', 'doNumber', 'partyNames', 'productName', 'qty', 'transportPayment', 'reasonOfMaterialReturn', 'debitNote', 'planned1'],
        'step2': ['returnNo', 'doNumber', 'partyNames', 'productName', 'qty', 'transportPayment', 'reasonOfMaterialReturn', 'debitNote', 'transporterName', 'biltyNo', 'typeOfRate', 'perMatricTonRate', 'fixedAmount', 'vehicleNo', 'receivedDate', 'planned2'],
        'step3': ['returnNo', 'doNumber', 'partyNames', 'productName', 'qty', 'transportPayment', 'reasonOfMaterialReturn', 'debitNote', 'transporterName', 'biltyNo', 'typeOfRate', 'perMatricTonRate', 'fixedAmount', 'vehicleNo', 'receivedDate', 'qtyOfReturnMaterial', 'conditionOfMaterial', 'photoOfReturnMaterial', 'partyDebitNoteNo', 'materialReturnNo', 'originalBillImage', 'planned3'],
        'step4': ['timestamp', 'returnNo', 'doNumber', 'partyNames', 'productName', 'qty', 'transportPayment', 'reasonOfMaterialReturn', 'debitNote', 'transporterName', 'biltyNo', 'typeOfRate', 'receivedDate', 'qtyOfReturnMaterial', 'rateOfMaterial', 'photoOfReturnMaterial', 'partyDebitNoteNo', 'materialReturnNo', 'billNo', 'amount', 'creditNoteCopy', 'creditNoteNo', 'planned4']
      };
      
      return stepColumns[activeStepFilter as keyof typeof stepColumns]?.includes(col.key) || false;
    });
  };

  const columns = useMemo(() => getColumns(), [activeStepFilter, isKittingView, isExplorerView]);

  // Get min width for table
  const getMinWidth = () => {
    if (isExplorerView) return 'min-w-[4800px]';
    if (isKittingView) return 'min-w-[1800px]';
    if (activeStepFilter === 'step1') return 'min-w-[1600px]';
    if (activeStepFilter === 'step2') return 'min-w-[2400px]';
    if (activeStepFilter === 'step3') return 'min-w-[3400px]';
    if (activeStepFilter === 'step4') return 'min-w-[3600px]';
    return 'min-w-[1400px]';
  };

  // Render action button based on row type and permissions
  const renderActionButton = (row: TableRow) => {
    if (isKittingView) {
      const kRow = row as FullKittingData;
      const isPaid = (kRow.status || '').toLowerCase().trim() === 'paid' || !!kRow.actual;
      
      if (isPaid) {
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Paid</span>
          </div>
        );
      }
      
      if (user.permissions.kitting) {
        return (
          <button 
            onClick={() => { setSelectedKitRow(kRow); setIsPaymentModalOpen(true); }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <DollarSign size={16} />
            Process Payment
          </button>
        );
      }
      
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <Lock size={16} />
          <span className="text-sm">No Permission</span>
        </div>
      );
    } else {
      const fRow = row as FmsData;
      const status = getStepStatus(fRow);
      const alreadyKitted = isRowKitted(fRow.returnNo);
      
      if (status.step === 'completed') {
        if (alreadyKitted) {
          return (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Kitted</span>
            </div>
          );
        }
        
        if (user.permissions.kitting) {
          return (
            <button 
              onClick={() => { setSelectedRow(fRow); setIsKittingModalOpen(true); }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <ArrowRightLeft size={16} />
              Forward to Kitting
            </button>
          );
        }
      } else {
        if (hasPermissionForStep(status.current)) {
          return (
            <button 
              onClick={() => { setSelectedRow(fRow); setIsUpdateModalOpen(true); }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md active:scale-95 transition-all"
            >
              Update Step
            </button>
          );
        }
      }
      
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <Lock size={16} />
          <span className="text-sm">No Permission</span>
        </div>
      );
    }
  };

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Filter className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        {searchTerm ? 'No matching records found' : 'No data available'}
      </h3>
      <p className="text-sm text-gray-500 max-w-md">
        {searchTerm 
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'There are currently no records in this view. Check back later or add new entries.'}
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header with search */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {isKittingView ? (
                <>
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment Kitting View
                </>
              ) : isExplorerView ? (
                <>
                  <Building className="w-5 h-5 text-blue-600" />
                  Complete Data Explorer
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 text-blue-600" />
                  Workflow
                  {activeStepFilter && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {activeStepFilter === 'step1' ? 'Arrange Logistics' :
                         activeStepFilter === 'step2' ? 'Material Receiving' :
                         activeStepFilter === 'step3' ? 'Credit Note Issuance' :
                         activeStepFilter === 'step4' ? 'Send to Party' : ''}
                      </span>
                    </>
                  )}
                </>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </p>
          </div>
          
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={isKittingView 
                ? "Search payments, transporters..." 
                : "Search by party, return number, product..."
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table content */}
      <div className="flex-1 overflow-auto">
        {filteredData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse ${getMinWidth()}`}>
              {/* Table Header */}
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left ${
                        column.className || ''
                      }`}
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center sticky right-0 bg-gray-50 min-w-[180px]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((row: TableRow, index: number) => {
                  const rowKey = isKittingView 
                    ? `kitting-${(row as FullKittingData).rowId || index}`
                    : `fms-${(row as FmsData).rowId || index}`;
                  
                  return (
                    <tr 
                      key={rowKey}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={`${rowKey}-${column.key}`}
                          className={`px-4 py-3 text-sm ${
                            column.key.includes('amount') || column.key.includes('Amount')
                              ? 'font-semibold'
                              : 'text-gray-600'
                          } ${column.className || ''}`}
                        >
                          {column.render(row)}
                        </td>
                      ))}
                      
                      {/* Action Column */}
                      <td className="px-6 py-3 sticky right-0 bg-white border-l border-gray-100">
                        <div className="flex justify-center">
                          {renderActionButton(row)}
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

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Total: <span className="font-medium">{filteredData.length}</span> records
          </div>
          <div className="text-xs text-gray-500">
            User: <span className="font-medium text-blue-600">{user.name}</span>
            <span className="mx-2">•</span>
            Role: <span className="font-medium text-gray-700">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUpdateModalOpen && selectedRow && (
        <UpdateStepModal 
          row={selectedRow} 
          onClose={() => setIsUpdateModalOpen(false)} 
          onSave={() => { onUpdate(); setIsUpdateModalOpen(false); }} 
        />
      )}
      
      {isKittingModalOpen && selectedRow && (
        <FullKittingModal 
          row={selectedRow} 
          kittingData={kittingData} 
          onClose={() => setIsKittingModalOpen(false)} 
          onSave={() => { onUpdate(); setIsKittingModalOpen(false); }} 
        />
      )}
      
      {isPaymentModalOpen && selectedKitRow && (
        <PaymentUpdateModal 
          row={selectedKitRow} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSave={() => { onUpdate(); setIsPaymentModalOpen(false); }} 
        />
      )}
    </div>
  );
};

export default WorkflowTable;