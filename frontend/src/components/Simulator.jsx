import React, { useEffect, useState } from 'react';
import { AlertTriangle, Play, HelpCircle, Activity, ShieldAlert, ArrowRight, CheckSquare, Layers } from 'lucide-react';

export default function Simulator() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch('http://localhost:8000/api/assets/risk');
        const data = await res.json();
        setAssets(data);
        if (data.length > 0) {
          setSelectedAsset(data[0].tag_number);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchAssets();
  }, []);

  const handleSimulate = async () => {
    if (!selectedAsset) return;
    setLoading(true);
    setSimulation(null);

    // Simulate delay for AI graph reasoning visualization
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:8000/api/simulator/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_tag: selectedAsset })
        });
        const data = await res.json();
        setSimulation(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit flex items-center space-x-2">
          <Layers className="text-amber-500 h-7 w-7" />
          <span>"What Happens If?" Risk Simulator</span>
        </h2>
        <p className="text-slate-400 text-sm">Predictive operational impact mapping. Uses knowledge graph traversals to forecast cascading equipment failures and compliance penalties.</p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <HelpCircle className="text-slate-400 h-10 w-10 flex-shrink-0" />
          <div className="space-y-1 w-full max-w-md">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Select Target Equipment Tag</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3.5 py-2.5 rounded-lg font-bold outline-none focus:border-amber-500/50"
            >
              {assets.map((a) => (
                <option key={a.tag_number} value={a.tag_number}>
                  {a.tag_number} - {a.name} ({a.location.split(' - ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || !selectedAsset}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all text-xs tracking-wider uppercase font-extrabold flex-shrink-0"
        >
          <Play className="h-4.5 w-4.5 fill-current" />
          <span>Run Failure Simulation</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-panel rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Traversing Knowledge Graph Relations...</h4>
            <p className="text-xs text-slate-500">Checking topological connections, down-stream process flows, and regulatory checklists.</p>
          </div>
        </div>
      )}

      {/* Simulation Results Output */}
      {simulation && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
          
          {/* Column 1: Primary Asset Failure risk specs */}
          <div className="glass-panel rounded-xl p-5 space-y-5 h-full">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target asset profile</span>
            
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2.5">
              <span className="bg-slate-850 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 font-mono tracking-wider">{simulation.target_tag}</span>
              <h3 className="text-base font-extrabold text-white font-outfit mt-1">{simulation.target_name}</h3>
              <p className="text-xs text-slate-500">{simulation.location}</p>
            </div>

            <div className="space-y-3.5">
              <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/15">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Failure Probability</span>
                <span className="text-xs font-bold text-red-400 mt-1 block">{simulation.failure_probability}</span>
              </div>

              <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/15">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Downtime Risk Level</span>
                <span className="text-xs font-bold text-amber-500 mt-1 block">{simulation.downtime_risk}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Failure Cascade Flow (Steps) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cascade Flow Chart cards */}
            <div className="glass-panel rounded-xl p-6 space-y-5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cascading Impact flowchart</span>

              <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
                
                {/* Event 1 */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-4.5 w-4.5 rounded-full bg-red-500 border-2 border-slate-900 ring-4 ring-red-500/10 flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono">1</span>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Primary Breakdown</h4>
                    <p className="text-xs text-slate-300 mt-1">Component failure on **{simulation.target_tag}** halting primary feed operations.</p>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-4.5 w-4.5 rounded-full bg-amber-500 border-2 border-slate-900 ring-4 ring-amber-500/10 flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono">2</span>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-2">
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Downstream Equipment Stress</h4>
                    {simulation.cascading_assets.map((item, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-850 text-xs flex justify-between items-center font-semibold">
                        <span>Tag: <span className="text-amber-500 font-mono">{item.tag}</span> | {item.name}</span>
                        <span className="text-red-400 text-[10px]">{item.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-4.5 w-4.5 rounded-full bg-blue-500 border-2 border-slate-900 ring-4 ring-blue-500/10 flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono">3</span>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-2">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Affected Process Loops</h4>
                    {simulation.affected_processes.map((p, idx) => (
                      <div key={idx} className="bg-slate-955 p-2 rounded border border-slate-850 text-xs font-semibold">
                        <span className="text-white block font-bold">{p.loop}</span>
                        <span className="text-slate-400 text-[10.5px] mt-0.5 block">{p.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event 4 */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-4.5 w-4.5 rounded-full bg-purple-500 border-2 border-slate-900 ring-4 ring-purple-500/10 flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono">4</span>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-2">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Triggered Regulatory Penalties</h4>
                    {simulation.compliance_risks.map((c, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-850 text-[11px] font-semibold leading-relaxed">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/25">{c.code} - {c.standard}</span>
                          <span className="text-red-400 font-bold uppercase text-[9px]">Severity: {c.severity}</span>
                        </div>
                        <p className="text-slate-400">{c.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* AI Mitigating checklist */}
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <CheckSquare className="text-emerald-400 h-5 w-5" />
                <span>AI Mitigation Checklist</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {simulation.mitigation_plan.map((step, idx) => (
                  <div key={idx} className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-xs text-emerald-350 leading-relaxed font-semibold">
                    📋 {step}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

// Simple loader icon
const Loader2 = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
