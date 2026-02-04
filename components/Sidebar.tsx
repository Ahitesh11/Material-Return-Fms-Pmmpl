'use client';

import React from 'react';
import { LayoutGrid, Truck, Package, FileText, Send, Table, CreditCard, ChevronRight, Zap, Database, Home, LogOut } from 'lucide-react';
import { View, User } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isLive?: boolean;
  user?: User;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isLive, 
  user,
  onLogout 
}) => {
  const allMenuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutGrid, color: 'text-blue-600' },
    { id: 'step1' as View, label: 'Arrange Logistics', icon: Truck, color: 'text-indigo-600' },
    { id: 'step2' as View, label: 'Received Returned', icon: Package, color: 'text-purple-600' },
    { id: 'step3' as View, label: 'Issue Credit Note', icon: FileText, color: 'text-pink-600' },
    { id: 'step4' as View, label: 'Send to Party', icon: Send, color: 'text-orange-600' },
    { id: 'kitting' as View, label: 'Transporter Payment', icon: CreditCard, color: 'text-green-600' },
    { id: 'table' as View, label: 'Complete Records', icon: Table, color: 'text-cyan-600' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!user) return false;
    return user.permissions[item.id as keyof typeof user.permissions];
  });

  const getViewDescription = (view: View): string => {
    switch (view) {
      // // case 'dashboard': return 'System overview & analytics';
      // case 'step1': return 'Manage transportation logistics';
      // case 'step2': return 'Process returned materials';
      // case 'step3': return 'Generate credit notes';
      // case 'step4': return 'Dispatch documentation';
      // case 'kitting': return 'Payment processing';
      // case 'table': return 'View all records';
      default: return '';
    }
  };

  return (
    <aside className="w-80 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col h-screen shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Home className="text-white" size={22} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Database size={10} className="text-blue-600" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-900">Material Return FMS</span>
            <span className="text-xs text-gray-500 font-medium"></span>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
          isLive ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isLive ? 'text-green-700' : 'text-amber-700'}`}>
              {isLive ? 'Live Connection' : 'Pmmpl'}
            </span>
            <Zap size={12} className={`${isLive ? 'text-green-500' : 'text-amber-500'}`} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-white shadow-sm' 
                      : 'bg-gray-100'
                  }`}>
                    <item.icon 
                      size={18} 
                      className={isActive ? item.color : 'text-gray-500'} 
                    />
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getViewDescription(item.id)}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <ChevronRight size={16} className="text-blue-500" />
                )}
              </button>
            );
          })}

          {/* Show message if no menu items (should not happen) */}
          {menuItems.length === 0 && (
            <div className="text-center p-4 text-gray-500 text-sm">
              No accessible views available. Contact administrator.
            </div>
          )}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="border-t border-gray-100 bg-white mt-auto p-4">
        {/* User info (if available) */}
        {user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-gray-900 text-center">{user.name}</p>
            <p className="text-xs text-gray-500 text-center">{user.role || 'User'}</p>
          </div>
        )}

        {/* Only show logout button */}
        <div className="flex items-center justify-center">
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>

        {/* System Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Powered by - Pasmin</p>
              <p className="text-[10px] text-gray-400 mt-1">Version 2.1.4 • PMMP Logistics</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;