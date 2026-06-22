import React from 'react';
import { LayoutDashboard, UploadCloud, MessageSquare, Network, ShieldCheck, Wrench, BrainCircuit, Layers } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingestion', label: 'Universal Ingestion', icon: UploadCloud },
    { id: 'chat', label: 'Expert Copilot', icon: MessageSquare },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'compliance', label: 'Compliance Audit', icon: ShieldCheck },
    { id: 'rca', label: 'Asset Digital Twin', icon: Wrench },
    { id: 'simulator', label: 'Risk Simulator', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <BrainCircuit className="h-8 w-8 text-amber-500 animate-pulse-subtle" />
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white font-outfit">INDUS BRAIN</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Asset OS</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/40">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-300">SYSTEM STABLE</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Seeded Plant: Chemical Facility A</p>
        </div>
      </div>
    </aside>
  );
}
