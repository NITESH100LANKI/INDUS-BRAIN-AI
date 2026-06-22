import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, Database, ArrowRight, ShieldAlert, FileSpreadsheet, BookOpen, Layers, CheckSquare, XCircle, Printer } from 'lucide-react';

export default function Dashboard({ setActiveTab, setSelectedAssetTag }) {
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch dashboard summary
        const sumRes = await fetch('http://localhost:8000/api/dashboard/summary');
        const sumData = await sumRes.json();
        setSummary(sumData);

        // Fetch asset risk list
        const assetRes = await fetch('http://localhost:8000/api/assets/risk');
        const assetData = await assetRes.json();
        setAssets(assetData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleAssetClick = (tag) => {
    setSelectedAssetTag(tag);
    setActiveTab('rca');
  };

  const copyBriefingToClipboard = () => {
    if (!summary) return;
    const reportText = (
      `# INDUS ENERGY PLANT - AI EXECUTIVE BRIEFING REPORT\n` +
      `Date: ${new Date().toLocaleDateString()} | Compliance: ${summary.compliance_score}%\n` +
      `==================================================\n\n` +
      `1. CURRENT STATUS\n` +
      `- Facility Health Score: ${summary.plant_health_score}%\n` +
      `- Outstanding Compliance Gaps: ${summary.active_gaps_count} active\n` +
      `- Downtime Alert: ${summary.downtime_risk_forecast}\n\n` +
      `2. TOP COMPLIANCE GAPS\n` +
      summary.top_compliance_violations.map(v => `* ${v}`).join('\n') + `\n\n` +
      `3. KEY ACTION PLANS RECOMMENDED\n` +
      `* Recertify Boiler BLR-201 valves (Sarah Jenkins, Due 2026-07-10)\n` +
      `* Laser align Pump PMP-101 and clear suction strainer (John Doe, Due 2026-07-12)\n` +
      `* Overlay tank bottom structural plates on TNK-601 (Dave Miller, Due 2026-07-20)\n`
    );
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="text-slate-400 text-sm">Initializing Executive Command Center telemetry...</p>
        </div>
      </div>
    );
  }

  // Split assets by zones to feed heatmap
  const zones = [
    { name: "Unit 1 - Power Block Area", risk: 82, criticality: "CRITICAL", color: "bg-red-500/20 border-red-500/40 text-red-400" },
    { name: "Unit 2 - Steam Reformer Zone", risk: 35, criticality: "MEDIUM", color: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
    { name: "Unit 3 - Hydrocracker Complex", risk: 40, criticality: "MEDIUM", color: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
    { name: "Unit 4 - Water Treatment Station", risk: 15, criticality: "LOW", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit uppercase">{summary.plant_name} Command Center</h2>
          <p className="text-slate-400 text-sm">Unified plant integrity dashboard. Monitored assets: 50 | Ingested docs: 35.</p>
        </div>
        
        <button
          onClick={() => setShowBriefing(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider uppercase font-extrabold flex items-center space-x-2 transition-all self-start md:self-auto"
        >
          <FileSpreadsheet className="h-4.5 w-4.5" />
          <span>AI Executive Briefing</span>
        </button>
      </div>

      {/* Overview Telemetry Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Plant Health score card */}
        <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plant Health Score</span>
            <span className="text-3xl font-black text-emerald-400 font-outfit mt-1 block">{summary.plant_health_score}%</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Based on 50 digital twins</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-full text-emerald-400">
            <Activity className="h-7 w-7" />
          </div>
        </div>

        {/* Compliance audit index card */}
        <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Index</span>
            <span className="text-3xl font-black text-blue-400 font-outfit mt-1 block">{summary.compliance_score}%</span>
            <span className="text-[10px] text-slate-500 mt-1 block">6 regulatory codes audited</span>
          </div>
          <div className="p-3.5 bg-blue-500/10 rounded-full text-blue-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

        {/* Assets at risk */}
        <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Assets At Risk</span>
            <span className="text-3xl font-black text-amber-500 font-outfit mt-1 block">{summary.critical_assets_count}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Risk score exceeding 55%</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 rounded-full text-amber-500 animate-pulse-subtle">
            <AlertTriangle className="h-7 w-7" />
          </div>
        </div>

        {/* Open Incidents count */}
        <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active safety alarms</span>
            <span className="text-3xl font-black text-red-400 font-outfit mt-1 block">{summary.open_incidents_count}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Requires immediate mitigations</span>
          </div>
          <div className="p-3.5 bg-red-500/10 rounded-full text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
        </div>

      </div>

      {/* Downtime Risk Alert block */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4.5 flex items-center space-x-3 shadow-md">
        <ShieldAlert className="h-6 w-6 text-red-400 animate-pulse-subtle flex-shrink-0" />
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Predictive Downtime Risk Forecast</span>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">{summary.downtime_risk_forecast}</p>
        </div>
      </div>

      {/* Grid: Predictive Heatmap vs Top Compliance Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Heatmap (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="text-amber-500 h-4.5 w-4.5" />
              <span>Predictive Operational Risk Heatmap</span>
            </h3>

            {/* Grid 2x2 representing facility zones risk levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between h-32 ${zone.color}`}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs uppercase text-white font-outfit leading-tight max-w-[200px]">{zone.name}</h4>
                    <span className="bg-slate-900/60 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest">{zone.criticality}</span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-4">
                    <div className="w-24">
                      <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                        <span>Risk level</span>
                        <span>{zone.risk}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-current" 
                          style={{ width: `${zone.risk}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-2xl font-black font-outfit">{zone.risk}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Assets risk rankings list */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top 5 Equipment Risk Rankings</h3>
              <button onClick={() => setActiveTab('rca')} className="text-[10px] text-amber-500 font-bold hover:underline flex items-center space-x-1">
                <span>Asset Twin Center</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            
            <div className="space-y-2">
              {assets.slice(0, 5).map((a) => (
                <div 
                  key={a.tag_number} 
                  onClick={() => handleAssetClick(a.tag_number)}
                  className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 flex items-center justify-between hover:border-amber-500/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="bg-slate-800 text-slate-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded">{a.tag_number}</span>
                    <span className="text-xs font-semibold text-slate-200">{a.name}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-right text-[11px] font-semibold">
                    <span className="text-slate-500">Health: <span className="text-emerald-400">{a.health_index}%</span></span>
                    <span className="text-slate-500">Risk: <span className="text-red-400">{a.risk_score}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Violations checklist and lessons learned (Right 1 Column) */}
        <div className="space-y-6">
          {/* Top compliance gaps */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="text-red-400 h-4.5 w-4.5" />
              <span>Outstanding Audit Deviations</span>
            </h3>
            
            <div className="space-y-2">
              {summary.top_compliance_violations.map((violation, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 flex items-start space-x-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                  <p className="text-xs text-slate-350 leading-relaxed font-medium">{violation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons Learned panel */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="text-amber-500 h-4.5 w-4.5" />
              <span>Lessons Learned This Month</span>
            </h3>
            
            <div className="space-y-2.5">
              {summary.lessons_learned_summary.map((lesson, idx) => (
                <div key={idx} className="p-3 bg-slate-900/30 rounded-lg border border-slate-850 text-xs text-slate-400 italic leading-relaxed">
                  💡 "{lesson}"
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* AI Executive Briefing Modal Overlay */}
      {showBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-2xl bg-[#090f1a] border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-white font-outfit flex items-center space-x-2">
                <FileSpreadsheet className="text-amber-500 h-5.5 w-5.5" />
                <span>AI Executive Briefing Report</span>
              </h3>
              <button 
                onClick={() => setShowBriefing(false)}
                className="text-slate-400 hover:text-white font-mono text-xs font-bold"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Print style Report body */}
            <div className="flex-1 overflow-y-auto space-y-5 bg-[#03060a] border border-slate-850 rounded-lg p-5 font-mono text-xs leading-relaxed text-slate-350">
              <div className="border-b border-slate-800 pb-4 text-center">
                <h4 className="text-sm font-black text-white tracking-widest">{summary.plant_name} STATUS SUMMARY</h4>
                <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()} | Operations Brain Engine</p>
              </div>

              <div>
                <span className="text-white font-black block mb-1">1. CURRENT FACILITY INTEGRITY STATISTICS</span>
                <p>• Overall Plant Health: {summary.plant_health_score}% (Monitored twins: 50)</p>
                <p>• Regulatory Compliance score: {summary.compliance_score}%</p>
                <p>• Open Safety anomalies: {summary.open_incidents_count} active alarm logs</p>
              </div>

              <div>
                <span className="text-white font-black block mb-1">2. CRITICAL PREDICTIVE SHUTDOWN ALERTS</span>
                <div className="bg-red-950/20 border border-red-900 p-2.5 rounded text-red-400">
                  {summary.downtime_risk_forecast}
                </div>
              </div>

              <div>
                <span className="text-white font-black block mb-1">3. REGULATORY COMPLIANCE GAPS RECORDED</span>
                {summary.top_compliance_violations.map((v, i) => (
                  <p key={i} className="pl-3">• {v}</p>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-white font-black block mb-1.5">4. IMMEDIATE OPERATIONS REMEDIATION MATRIX</span>
                <table className="w-full text-left border-collapse text-[11px] text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="pb-1.5">Task Description</th>
                      <th className="pb-1.5">Owner</th>
                      <th className="pb-1.5">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="py-2.5 pr-2">ASME validation BLR-201 check</td>
                      <td className="py-2.5">S. Jenkins</td>
                      <td className="py-2.5">2026-07-10</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-2.5 pr-2">Coupling laser align PMP-101</td>
                      <td className="py-2.5">J. Doe</td>
                      <td className="py-2.5">2026-07-12</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-2.5 pr-2">API 653 shell reinforcement TNK-601</td>
                      <td className="py-2.5">D. Miller</td>
                      <td className="py-2.5">2026-07-20</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end space-x-2">
              <button
                onClick={copyBriefingToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded text-xs tracking-wider uppercase flex items-center space-x-1.5 border border-slate-700"
              >
                <Printer className="h-4 w-4 text-amber-500" />
                <span>{copiedReport ? "Report Copied!" : "Copy Report Markdown"}</span>
              </button>
              
              <button
                onClick={() => setShowBriefing(false)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 rounded text-xs tracking-wider uppercase"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}

// Simple spinner component
const Loader2 = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
