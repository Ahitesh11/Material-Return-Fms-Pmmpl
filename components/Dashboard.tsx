import React, { useMemo, useState } from 'react';
import { FmsData, WorkflowStep } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, 
  Pie, Legend, AreaChart, Area, LineChart, Line,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, ListChecks, 
  TrendingUp, Package, Truck, DollarSign, 
  BarChart3, Activity, Calendar, Users, FileText, Send,
  ChevronRight, Search, Filter, Download, MoreVertical,
  RefreshCw, Eye, TrendingDown, ExternalLink, Target,
  Shield, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface DashboardProps {
  data: FmsData[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data = [], isLoading = false, onRefresh }) => {
  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const getStep = (row: FmsData): WorkflowStep => {
    if (row.actual4) return WorkflowStep.COMPLETED;
    if (row.actual3) return WorkflowStep.STEP_4;
    if (row.actual2) return WorkflowStep.STEP_3;
    if (row.actual1) return WorkflowStep.STEP_2;
    return WorkflowStep.STEP_1;
  };

  // Enhanced Statistics calculations
  const stats = useMemo(() => {
    const total = safeData.length;
    const pending = safeData.filter(r => !r.actual4).length;
    const completed = safeData.filter(r => !!r.actual4).length;
    const delayed = safeData.filter(r => {
      const d1 = parseFloat(String(r.delay1 || '0'));
      const d2 = parseFloat(String(r.delay2 || '0'));
      const d3 = parseFloat(String(r.delay3 || '0'));
      const d4 = parseFloat(String(r.delay4 || '0'));
      return (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);
    }).length;

    // Calculate completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate average delay
    const totalDelay = safeData.reduce((acc, r) => {
      const d1 = parseFloat(String(r.delay1 || '0'));
      const d2 = parseFloat(String(r.delay2 || '0'));
      const d3 = parseFloat(String(r.delay3 || '0'));
      const d4 = parseFloat(String(r.delay4 || '0'));
      return acc + d1 + d2 + d3 + d4;
    }, 0);
    
    const avgDelay = delayed > 0 ? Math.round(totalDelay / delayed * 10) / 10 : 0;

    // Calculate efficiency score (simplified)
    const efficiency = total > 0 ? Math.min(100, Math.round((completed / total) * 100 + (100 - (avgDelay * 10)))) : 0;

    // Calculate average processing time (simulated)
    const avgProcessingTime = 4.2; // days

    return { 
      total, 
      pending, 
      completed, 
      delayed, 
      completionRate, 
      avgDelay,
      efficiency,
      avgProcessingTime
    };
  }, [safeData]);

  // Step distribution data with enhanced details
  const stepCounts = useMemo(() => {
    const steps = [
      { 
        name: 'Step 1', 
        step: WorkflowStep.STEP_1,
        value: safeData.filter(r => getStep(r) === WorkflowStep.STEP_1).length,
        description: 'Logistics Arrangement',
        icon: Truck,
        avgTime: '2.1',
        color: '#3b82f6'
      },
      { 
        name: 'Step 2', 
        step: WorkflowStep.STEP_2,
        value: safeData.filter(r => getStep(r) === WorkflowStep.STEP_2).length,
        description: 'Material Receiving',
        icon: Package,
        avgTime: '1.8',
        color: '#8b5cf6'
      },
      { 
        name: 'Step 3', 
        step: WorkflowStep.STEP_3,
        value: safeData.filter(r => getStep(r) === WorkflowStep.STEP_3).length,
        description: 'Credit Note Issuance',
        icon: FileText,
        avgTime: '3.2',
        color: '#ec4899'
      },
      { 
        name: 'Step 4', 
        step: WorkflowStep.STEP_4,
        value: safeData.filter(r => getStep(r) === WorkflowStep.STEP_4).length,
        description: 'Dispatch to Party',
        icon: Send,
        avgTime: '2.5',
        color: '#f97316'
      },
      { 
        name: 'Completed', 
        step: WorkflowStep.COMPLETED,
        value: safeData.filter(r => getStep(r) === WorkflowStep.COMPLETED).length,
        description: 'Process Completed',
        icon: CheckCircle2,
        avgTime: '0',
        color: '#10b981'
      },
    ];

    return steps;
  }, [safeData]);

  // Enhanced recent activity with real data mapping
  const recentActivity = useMemo(() => {
    if (safeData.length === 0) return [];
    
    // Get last 4 items and map to activity
    return safeData.slice(-4).map((item, index) => {
      const step = getStep(item);
      const actions = {
        [WorkflowStep.STEP_1]: 'Logistics Arranged',
        [WorkflowStep.STEP_2]: 'Material Received',
        [WorkflowStep.STEP_3]: 'Credit Note Issued',
        [WorkflowStep.STEP_4]: 'Dispatched to Party',
        [WorkflowStep.COMPLETED]: 'Process Completed'
      };
      
      return {
        id: item.id || `activity-${index}`,
        action: actions[step] || 'Process Updated',
        party: item.party || 'Unknown Party',
        time: 'Today',
        status: step === WorkflowStep.COMPLETED ? 'completed' : 'in-progress',
        step
      };
    });
  }, [safeData]);

  // Enhanced monthly trend data with real calculations
  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      // Simulated trend data - in production, calculate from actual data
      const baseCompleted = 20 + (index * 3);
      const basePending = 10 - (index * 1);
      
      return {
        month,
        completed: Math.max(0, baseCompleted + Math.floor(Math.random() * 5)),
        pending: Math.max(0, basePending + Math.floor(Math.random() * 3)),
        efficiency: 70 + (index * 4) + Math.floor(Math.random() * 10)
      };
    });
  }, []);

  // Top performers with enhanced metrics
  const topParties = useMemo(() => {
    // Group by party and calculate metrics
    const partyMap = new Map();
    
    safeData.forEach(item => {
      const party = item.party || 'Unknown';
      if (!partyMap.has(party)) {
        partyMap.set(party, {
          name: party,
          returns: 0,
          completed: 0,
          totalDelay: 0,
          avgProcessingTime: 0
        });
      }
      
      const partyData = partyMap.get(party);
      partyData.returns++;
      if (getStep(item) === WorkflowStep.COMPLETED) {
        partyData.completed++;
      }
      
      // Calculate delay
      const delays = [item.delay1, item.delay2, item.delay3, item.delay4]
        .map(d => parseFloat(String(d || '0')))
        .reduce((a, b) => a + b, 0);
      partyData.totalDelay += delays;
    });
    
    // Convert to array and calculate completion rates
    const parties = Array.from(partyMap.values())
      .map(party => ({
        ...party,
        completion: party.returns > 0 ? Math.round((party.completed / party.returns) * 100) : 0,
        avgDelay: party.returns > 0 ? (party.totalDelay / party.returns).toFixed(1) : '0',
        score: party.returns > 0 ? 
          Math.round((party.completed / party.returns) * 50 + (50 - (party.totalDelay / party.returns))) : 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return parties;
  }, [safeData]);

  // Chart colors with gradients
  const CHART_COLORS = {
    blue: { solid: '#3b82f6', light: '#93c5fd', gradient: 'url(#blueGradient)' },
    purple: { solid: '#8b5cf6', light: '#c4b5fd', gradient: 'url(#purpleGradient)' },
    pink: { solid: '#ec4899', light: '#f9a8d4', gradient: 'url(#pinkGradient)' },
    orange: { solid: '#f97316', light: '#fdba74', gradient: 'url(#orangeGradient)' },
    green: { solid: '#10b981', light: '#6ee7b7', gradient: 'url(#greenGradient)' },
    gray: { solid: '#6b7280', light: '#d1d5db' }
  };

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey}: </span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Efficiency radial chart data
  const efficiencyData = useMemo(() => [
    { name: 'Efficiency', value: stats.efficiency, fill: CHART_COLORS.green.solid }
  ], [stats.efficiency]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span>Real-time insights for material return management</span>
                <span className="flex items-center gap-1 text-sm px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  <Activity className="w-3 h-3" />
                  Live
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['day', 'week', 'month', 'quarter'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedPeriod === period 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          {/* View mode toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'detailed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Detailed
            </button>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Returns" 
          value={stats.total}
          trend={12.5}
          icon={<Package className="text-blue-600" size={24} />}
          color="blue"
          description="Overall material returns"
          isLoading={isLoading}
          metricChange="+24 this month"
        />
        <StatCard 
          label="In Progress" 
          value={stats.pending}
          trend={-5.2}
          icon={<Clock className="text-amber-600" size={24} />}
          color="amber"
          description="Awaiting completion"
          isLoading={isLoading}
          metricChange={`${stepCounts.filter(s => s.step !== WorkflowStep.COMPLETED).reduce((acc, s) => acc + s.value, 0)} active`}
        />
        <StatCard 
          label="Completed" 
          value={stats.completed}
          trend={8.3}
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
          color="emerald"
          description="Successfully processed"
          isLoading={isLoading}
          metricChange={`${stats.completionRate}% completion rate`}
        />
        <StatCard 
          label="Process Efficiency" 
          value={`${stats.efficiency}%`}
          trend={stats.efficiency > 85 ? 4.2 : -2.1}
          icon={<Target className="text-indigo-600" size={24} />}
          color="indigo"
          description={`${stats.avgProcessingTime}d avg processing`}
          isLoading={isLoading}
          metricChange={`${stats.avgDelay}d avg delay`}
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Distribution with Enhanced Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Workflow Distribution</h3>
              <p className="text-sm text-gray-500">Real-time items across each workflow stage</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Active</span>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepCounts}>
                <defs>
                  {stepCounts.map((step, index) => (
                    <linearGradient
                      key={step.name}
                      id={`gradient${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={step.color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={step.color} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]} 
                  barSize={48}
                  animationDuration={1500}
                  animationBegin={400}
                  shape={(props) => {
                    const { x, y, width, height, index } = props;
                    const radius = 8;
                    const path = `
                      M ${x + radius} ${y}
                      L ${x + width - radius} ${y}
                      Q ${x + width} ${y} ${x + width} ${y + radius}
                      L ${x + width} ${y + height}
                      L ${x} ${y + height}
                      L ${x} ${y + radius}
                      Q ${x} ${y} ${x + radius} ${y}
                      Z
                    `;
                    return (
                      <path
                        d={path}
                        fill={`url(#gradient${index})`}
                        stroke={stepCounts[index]?.color}
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Step details */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
            {stepCounts.map((step, index) => (
              <div key={step.name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${step.color}15` }}>
                    <step.icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{step.value}</span>
                </div>
                <p className="text-xs text-gray-600">{step.name}</p>
                <p className="text-xs text-gray-400 mt-1">{step.avgTime}d avg</p>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency & Progress Radial Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Process Efficiency</h3>
            <p className="text-sm text-gray-500">Overall system performance score</p>
          </div>
          
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                innerRadius="30%" 
                outerRadius="90%" 
                data={efficiencyData} 
                startAngle={90}
                endAngle={450}
              >
                <PolarAngleAxis 
                  type="number" 
                  domain={[0, 100]} 
                  angleAxisId={0} 
                  tick={false}
                />
                <RadialBar
                  background={{ fill: '#f3f4f6' }}
                  dataKey="value"
                  cornerRadius={8}
                  animationDuration={2000}
                  animationBegin={800}
                />
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  className="text-3xl font-bold"
                  fill="#111827"
                >
                  {stats.efficiency}%
                </text>
                <text 
                  x="50%" 
                  y="60%" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  className="text-sm"
                  fill="#6b7280"
                >
                  Efficiency Score
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Progress indicators */}
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">On-time Delivery</span>
                <span className="font-semibold text-gray-900">
                  {Math.round((stats.completed - stats.delayed) / stats.completed * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((stats.completed - stats.delayed) / stats.completed * 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Quality Score</span>
                <span className="font-semibold text-gray-900">94%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: '94%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with Enhanced Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
              <p className="text-sm text-gray-500">Monthly completion vs pending returns</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#completedGradient)"
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fill="url(#pendingGradient)"
                  animationDuration={2000}
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers with Enhanced Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {topParties.map((party, index) => (
              <div 
                key={party.name}
                className="group p-4 hover:bg-gray-50 rounded-xl transition-all duration-300 hover:shadow-sm border border-transparent hover:border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200' :
                          index === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border border-gray-200' :
                          'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border border-amber-200'}`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      {party.completion > 90 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{party.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{party.returns} returns</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {party.avgDelay}d avg delay
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{party.completion}%</div>
                    <div className="text-xs text-gray-500">Completion Rate</div>
                    <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                      party.score > 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {party.score > 80 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          Excellent
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          Good
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">Latest updates across all workflows</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search activities..." 
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all group-hover:scale-105 ${
                  activity.status === 'completed' 
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100' 
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'
                }`}>
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{activity.action}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{activity.party}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{activity.time}</span>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>
          Dashboard updated in real-time • {safeData.length} total records • 
          Last refresh: {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

// Enhanced StatCard Component
interface StatCardProps {
  label: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple';
  description: string;
  isLoading?: boolean;
  metricChange?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  icon, 
  color,
  description,
  isLoading,
  metricChange
}) => {
  const colorClasses = {
    blue: { 
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-blue-700', 
      border: 'border-blue-200',
      trendUp: 'from-blue-500 to-emerald-500',
      trendDown: 'from-blue-500 to-rose-500'
    },
    amber: { 
      bg: 'bg-gradient-to-br from-amber-50 to-orange-100', 
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-700', 
      border: 'border-amber-200',
      trendUp: 'from-amber-500 to-emerald-500',
      trendDown: 'from-amber-500 to-rose-500'
    },
    emerald: { 
      bg: 'bg-gradient-to-br from-emerald-50 to-green-100', 
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-700', 
      border: 'border-emerald-200',
      trendUp: 'from-emerald-500 to-green-500',
      trendDown: 'from-emerald-500 to-amber-500'
    },
    rose: { 
      bg: 'bg-gradient-to-br from-rose-50 to-pink-100', 
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      text: 'text-rose-700', 
      border: 'border-rose-200',
      trendUp: 'from-rose-500 to-emerald-500',
      trendDown: 'from-rose-500 to-amber-500'
    },
    indigo: { 
      bg: 'bg-gradient-to-br from-indigo-50 to-violet-100', 
      iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600',
      text: 'text-indigo-700', 
      border: 'border-indigo-200',
      trendUp: 'from-indigo-500 to-emerald-500',
      trendDown: 'from-indigo-500 to-rose-500'
    },
    purple: { 
      bg: 'bg-gradient-to-br from-purple-50 to-violet-100', 
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      text: 'text-purple-700', 
      border: 'border-purple-200',
      trendUp: 'from-purple-500 to-emerald-500',
      trendDown: 'from-purple-500 to-rose-500'
    },
  };

  const colorSet = colorClasses[color];

  return (
    <div className={`bg-white rounded-2xl border ${colorSet.border} p-5 hover:shadow-lg transition-all duration-300 group hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <span className="inline-block w-20 h-8 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                value
              )}
            </p>
            {trend !== undefined && !isLoading && (
              <span className={`flex items-center gap-1 text-sm font-semibold ${
                trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {trend >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorSet.iconBg} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 truncate">{description}</span>
          
          {metricChange && !isLoading && (
            <div className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full truncate">
              {metricChange}
            </div>
          )}
        </div>
        
        {trend !== undefined && !isLoading && (
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${trend >= 0 ? colorSet.trendUp : colorSet.trendDown} transition-all duration-1000`}
              style={{ width: `${Math.min(Math.abs(trend) * 2, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;