import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WorkflowTable from './components/WorkflowTable';
import NewEntryForm from './components/NewEntryForm';
import Login from './components/Login';
import { View, FmsData, FullKittingData, User } from './types';
import { PlusCircle, RefreshCw, Menu, AlertCircle, Home, Database, Activity } from 'lucide-react';

declare const google: any;

export const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwOoPwBBUuJVBvwXRlPya5BmwbtgwZNio4_GUmXhVVO8b_XOe3dFyAQ0OQaVCf0rrk_/exec";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [data, setData] = useState<FmsData[]>([]);
  const [kittingData, setKittingData] = useState<FullKittingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Set initial view based on first available permission
  useEffect(() => {
    if (user) {
      // Check if current view is accessible
      if (!user.permissions[currentView as keyof typeof user.permissions]) {
        // Find first accessible view
        const accessibleViews = (Object.keys(user.permissions) as (keyof typeof user.permissions)[])
          .filter(key => user.permissions[key]);
        
        if (accessibleViews.length > 0) {
          // Try to set dashboard first, otherwise first accessible view
          if (accessibleViews.includes('dashboard')) {
            setCurrentView('dashboard');
          } else {
            setCurrentView(accessibleViews[0] as View);
          }
        }
      }
    }
  }, [user, currentView]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    const isGoogle = typeof google !== 'undefined' && google.script && google.script.run;
    setIsLive(!!isGoogle);

    if (isGoogle) {
      google.script.run
        .withSuccessHandler((result: any) => {
          if (!result) {
            setData([]);
            setKittingData([]);
          } else {
            setData(result.fms || []);
            setKittingData(result.kitting || []);
          }
          setLoading(false);
        })
        .withFailureHandler((err: any) => {
          setError(`Connection error: ${err?.message || 'Unable to fetch data'}`);
          setLoading(false);
        })
        .getAllData();
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}?action=getAllData`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      setData(result?.fms || []);
      setKittingData(result?.kitting || []);
    } catch (err: any) {
      setError(`Network error: Please check your connection or use native mode.`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchData, user]);

  const handleLogout = () => {
    localStorage.removeItem('fms_user');
    setUser(null);
    setCurrentView('dashboard');
  };

  const getViewTitle = () => {
    const titles: Record<View, string> = {
      'dashboard': 'Dashboard Overview',
      'step1': 'Arrange Logistics',
      'step2': 'Material Receiving',
      'step3': 'Credit Note Issuance',
      'step4': 'Send to Party',
      'table': 'Complete Records',
      'kitting': 'Transporter Payments'
    };
    return titles[currentView] || 'Material Return FMS';
  };

  const getViewIcon = () => {
    const icons: Record<View, React.ReactNode> = {
      'dashboard': <Home className="w-5 h-5 text-blue-600" />,
      'step1': <Activity className="w-5 h-5 text-indigo-600" />,
      'step2': <Database className="w-5 h-5 text-purple-600" />,
      'step3': <Database className="w-5 h-5 text-green-600" />,
      'step4': <Activity className="w-5 h-5 text-orange-600" />,
      'table': <Database className="w-5 h-5 text-cyan-600" />,
      'kitting': <Database className="w-5 h-5 text-pink-600" />
    };
    return icons[currentView] || <Home className="w-5 h-5 text-gray-600" />;
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const hasPermission = user.permissions[currentView as keyof typeof user.permissions];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar 
          currentView={currentView} 
          setView={(v) => { 
            setCurrentView(v); 
            setIsSidebarOpen(false); 
          }} 
          isLive={isLive}
          user={user}
          onLogout={handleLogout}
        />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              {getViewIcon()}
              <h1 className="font-semibold text-gray-800 text-sm">{getViewTitle()}</h1>
            </div>
          </div>
          
          <div className="w-8"></div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getViewIcon()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getViewTitle()}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className={`flex items-center gap-1 ${isLive ? 'text-green-600' : 'text-blue-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
                    {isLive ? 'Live Connection' : 'Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Entry Button */}
            {user.permissions.step1 && currentView !== 'kitting' && (
              <button 
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <PlusCircle size={18} />
                New Entry
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Connection Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading data from server...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          ) : (
            <div className="h-full animate-in fade-in duration-300">
              {/* Dashboard View */}
              {currentView === 'dashboard' && hasPermission && (
                <div className="h-full">
                  <Dashboard data={data} />
                </div>
              )}

              {/* Workflow Views */}
              {currentView !== 'dashboard' && hasPermission && (
                <div className="h-full flex flex-col">
                  <WorkflowTable 
                    data={data} 
                    kittingData={kittingData}
                    onUpdate={fetchData} 
                    activeStepFilter={currentView} 
                    user={user}
                  />
                </div>
              )}

              {/* No Permission (should not happen as inaccessible views are hidden) */}
              {!hasPermission && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    You don't have permission to view this section. Please contact your administrator for access.
                  </p>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showNewForm && (
          <NewEntryForm 
            onClose={() => setShowNewForm(false)} 
            onSave={() => {
              setShowNewForm(false);
              fetchData();
            }} 
            existingData={data} 
          />
        )}
      </main>
    </div>
  );
};

export default App;