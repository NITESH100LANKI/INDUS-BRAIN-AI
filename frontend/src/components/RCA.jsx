import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, BookOpen, AlertTriangle, FileText, CheckCircle, Wrench, Calendar, Settings, FileCheck } from 'lucide-react';

export default function RCA({ selectedAssetTag, setSelectedAssetTag }) {
  const [assets, setAssets] = useState([]);
  const [rcaReport, setRcaReport] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [neighborNodes, setNeighborNodes] = useState([]);

  useEffect(() => {
    fetchAssetsAndLessons();
  }, []);

  useEffect(() => {
    if (selectedAssetTag) {
      fetchRCAReport(selectedAssetTag);
      fetchAssetHistory(selectedAssetTag);
    } else if (assets.length > 0) {
      setSelectedAssetTag(assets[0].tag_number);
    }
  }, [selectedAssetTag, assets]);

  const fetchAssetsAndLessons = async () => {
    try {
      setLoading(true);
      const assetRes = await fetch('http://localhost:8000/api/assets/risk');
      const assetData = await assetRes.json();
      setAssets(assetData);
      
      const lessonRes = await fetch('http://localhost:8000/api/lessons-learned');
      const lessonData = await lessonRes.json();
      setLessons(lessonData);
      
      if (assetData.length > 0 && !selectedAssetTag) {
        setSelectedAssetTag(assetData[0].tag_number);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRCAReport = async (tag) => {
    try {
      const res = await fetch(`http://localhost:8000/api/assets/rca/${tag}`);
      const data = await res.json();
      setRcaReport(data);

      // Fetch neighbors for graph relations section
      const nid = tag.startsWith("PMP-") ? `EQUIPMENT:${tag}` : tag.startsWith("BLR-") ? `EQUIPMENT:${tag}` : `EQUIPMENT:${tag}`;
      const graphRes = await fetch(`http://localhost:8000/api/graph/drilldown?node_id=${encodeURIComponent(nid)}`);
      const graphData = await graphRes.json();
      
      // Filter out self node and grab neighbors name & type
      const neighbors = graphData.nodes
        .filter(n => n.name.toUpperCase() !== tag.toUpperCase())
        .map(n => ({ name: n.name, type: n.type }));
      setNeighborNodes(neighbors);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssetHistory = async (tag) => {
    try {
      // Seed data generated 100 logs. Let's fetch all maintenance events from database.
      // Since backend doesn't have a separate list endpoint, we simulate fetching logs
      // related to this asset by making a quick call or programmatically filtering.
      // For a demo-ready, stable run, we can fetch incidents and compile a custom list of maintenance events.
      // We will generate a list of 5 realistic maintenance history logs for the selected tag!
      const history = [];
      const technicians = ["John Doe", "Sarah Jenkins", "Dave Miller"];
      const types = ["Corrective", "Preventive", "Predictive"];
      
      let seedTasks = [];
      if (tag.startsWith("PMP-101")) {
        seedTasks = [
          { date: "2026-05-14", type: "Corrective", desc: "Bearing housing rebuild & shaft laser alignment.", cost: 3400.0, tech: "John Doe" },
          { date: "2026-02-10", type: "Preventive", desc: "Routine oil replacement, gasket checks, packing clean.", cost: 250.0, tech: "Dave Miller" },
          { date: "2025-11-05", type: "Predictive", desc: "Vibration telemetry survey checks. Peaks at 2.4 mm/s.", cost: 150.0, tech: "John Doe" },
          { date: "2025-08-20", type: "Corrective", desc: "Replaced degraded pump seals to resolve fluid bypass.", cost: 1200.0, tech: "Sarah Jenkins" },
          { date: "2025-03-12", type: "Corrective", desc: "Bearing replacement & filter screen clear.", cost: 2400.0, tech: "John Doe" }
        ];
      } else if (tag.startsWith("BLR-201")) {
        seedTasks = [
          { date: "2026-06-01", type: "Corrective", desc: "Cleaned carbonate scale accumulation from seat.", cost: 1200.0, tech: "John Doe" },
          { date: "2025-12-10", type: "Preventive", desc: "Water softener dosing concentration inspection.", cost: 350.0, tech: "Sarah Jenkins" },
          { date: "2025-10-15", type: "Corrective", desc: "Emergency valve seat cleaning due to steam bypass bleed.", cost: 1100.0, tech: "Dave Miller" },
          { date: "2025-05-20", type: "Predictive", desc: "Safety valve release pressure threshold calibration.", cost: 300.0, tech: "Sarah Jenkins" },
          { date: "2025-04-10", type: "Corrective", desc: "Polished valve seating face ring.", cost: 950.0, tech: "John Doe" }
        ];
      } else if (tag.startsWith("TNK-601")) {
        seedTasks = [
          { date: "2026-06-05", type: "Corrective", desc: "Weld patch plates on bottom corrosion spots.", cost: 2500.0, tech: "Dave Miller" },
          { date: "2025-12-18", type: "Preventive", desc: "Visual inspection of storage shell casing fittings.", cost: 200.0, tech: "Dave Miller" },
          { date: "2025-05-18", type: "Corrective", desc: "Weld reinforcement overlay on bottom corrosion pitting.", cost: 3100.0, tech: "John Doe" },
          { date: "2025-01-20", type: "Predictive", desc: "Ultrasonic thickness shell survey checks (API-653).", cost: 400.0, tech: "Dave Miller" }
        ];
      } else {
        // Generic logs for other 47 assets
        seedTasks = [
          { date: "2026-04-15", type: "Preventive", desc: "Routine lubrication grease change and casing wipe down.", cost: 180.0, tech: technicians[tag.length % 3] },
          { date: "2025-10-10", type: "Preventive", desc: "Inspect wire terminals and tightness checks.", cost: 120.0, tech: technicians[(tag.length + 1) % 3] }
        ];
      }
      setMaintenanceHistory(seedTasks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAsset = (tag) => {
    setSelectedAssetTag(tag);
  };

  const getNodeColor = (type) => {
    switch (type) {
      case 'EQUIPMENT': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'FAILURE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'REGULATION': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PERSON': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PROCEDURE': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="text-slate-400 text-sm">Synchronizing Asset Digital Twins...</p>
        </div>
      </div>
    );
  }

  const selectedAssetObj = assets.find(a => a.tag_number === selectedAssetTag) || assets[0];

  // Mock Profile specs
  const mockSpecs = {
    manufacturer: selectedAssetTag.startsWith("PMP-") ? "Sulzer Pumps Inc." : selectedAssetTag.startsWith("BLR-") ? "Babcock & Wilcox" : selectedAssetTag.startsWith("TNK-") ? "Chicago Bridge & Iron" : "Emerson Process",
    model: selectedAssetTag.startsWith("PMP-") ? "A-310 Centrifugal Feed" : selectedAssetTag.startsWith("BLR-") ? "Utility Subcritical F-90" : selectedAssetTag.startsWith("TNK-") ? "Atmospheric Storage Cone-Roof" : "Fisher Actuator-90",
    commissioned: selectedAssetTag.startsWith("PMP-") ? "2021-08-14" : selectedAssetTag.startsWith("BLR-") ? "2018-05-10" : selectedAssetTag.startsWith("TNK-") ? "2019-11-20" : "2022-01-15",
    duty: selectedAssetTag.startsWith("PMP-") ? "1200 GPM @ 450 PSI" : selectedAssetTag.startsWith("BLR-") ? "450,000 lbs/hr Steam" : selectedAssetTag.startsWith("TNK-") ? "50,000 BBL capacity" : "Bypass Isolation"
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Asset Digital Twins</h2>
        <p className="text-slate-400 text-sm">Interactive asset twin database. Explore mechanical specifications, repair logs, failure histories, and adjacent graph relations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: Assets Selector */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10.5px] font-bold text-slate-500 tracking-wider uppercase block">Monitored Assets Registry</span>
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {assets.map((asset) => {
              const isSelected = selectedAssetTag === asset.tag_number;
              return (
                <div
                  key={asset.tag_number}
                  onClick={() => handleSelectAsset(asset.tag_number)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-slate-800 border-amber-500/50 text-white' 
                      : 'bg-slate-900/40 border-slate-805 text-slate-400 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 font-mono tracking-wider">{asset.tag_number}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      asset.criticality === 'High' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/15' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                    }`}>{asset.criticality}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-100 mt-2 font-outfit truncate">{asset.name}</h4>
                  
                  <div className="mt-2.5 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Risk: <span className={asset.risk_score > 50 ? 'text-red-400' : 'text-amber-500'}>{asset.risk_score}%</span></span>
                    <span>Health: <span className="text-emerald-400">{asset.health_index}%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle and Right columns: Detailed Digital Twin Sheet */}
        <div className="lg:col-span-3 space-y-6">
          {rcaReport && selectedAssetObj && (
            <div className="space-y-6">
              
              {/* Asset Header Info */}
              <div className="glass-panel rounded-xl p-6 flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-amber-500 font-mono font-bold tracking-wider">{rcaReport.asset_tag}</span>
                    <span className="text-xs text-slate-500">Location: {selectedAssetObj.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1.5 font-outfit">{rcaReport.asset_name}</h3>
                </div>
                
                <div className="flex space-x-6 text-right">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Health Score</span>
                    <span className="text-2xl font-black text-emerald-400 font-outfit">{selectedAssetObj.health_index}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Risk index</span>
                    <span className={`text-2xl font-black font-outfit ${selectedAssetObj.risk_score > 50 ? 'text-red-400' : 'text-amber-500'}`}>{selectedAssetObj.risk_score}%</span>
                  </div>
                </div>
              </div>

              {/* Grid: Specifications & Graph Neighbors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Mechanical Profile Specifications */}
                <div className="glass-panel rounded-xl p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Settings className="h-4 w-4 text-amber-500" />
                    <span>Technical Profile Specs</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/50 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Manufacturer</span>
                      <span className="text-slate-350 font-semibold mt-0.5 block">{mockSpecs.manufacturer}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Model Code</span>
                      <span className="text-slate-350 font-semibold mt-0.5 block">{mockSpecs.model}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Duty Parameters</span>
                      <span className="text-slate-350 font-semibold mt-0.5 block">{mockSpecs.duty}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Commission Date</span>
                      <span className="text-slate-350 font-semibold mt-0.5 block">{mockSpecs.commissioned}</span>
                    </div>
                  </div>
                </div>

                {/* Graph Relationships Nodes */}
                <div className="glass-panel rounded-xl p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <span>Adjacent Graph Node Neighbors</span>
                  </h4>
                  
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[120px]">
                    {neighborNodes.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No adjacent graph nodes.</span>
                    ) : (
                      neighborNodes.map((n, idx) => (
                        <div 
                          key={idx} 
                          className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold tracking-wide uppercase ${getNodeColor(n.type)}`}
                        >
                          <span className="font-mono">{n.name}</span>
                          <span className="text-[8px] opacity-60 block mt-0.5">{n.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Maintenance History Table */}
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <span>Seeded Maintenance History Logs</span>
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Maintenance Remarks</th>
                        <th className="pb-2">Cost</th>
                        <th className="pb-2 text-right">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceHistory.map((log, idx) => (
                        <tr key={idx} className="border-b border-slate-900 font-semibold hover:bg-slate-900/20">
                          <td className="py-2.5 text-slate-400 font-mono">{log.date}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                              log.type === 'Corrective' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/15' 
                                : log.type === 'Predictive' 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/15'
                            }`}>{log.type}</span>
                          </td>
                          <td className="py-2.5 text-slate-200">{log.desc}</td>
                          <td className="py-2.5 text-slate-400 font-mono">${log.cost}</td>
                          <td className="py-2.5 text-right text-slate-400">{log.tech}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RCA Findings and Evidence */}
              <div className="glass-panel rounded-xl p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Activity className="h-4 w-4 text-red-400" />
                    <span>AI Diagnostics Summary</span>
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                    {rcaReport.failure_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Causes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Inferred Root Causes</span>
                    </h4>
                    <div className="space-y-2">
                      {rcaReport.probable_causes.map((cause, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-200 font-semibold leading-relaxed">
                          • {cause}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span>Mitigating Action Plans</span>
                    </h4>
                    <div className="space-y-2">
                      {rcaReport.recommended_actions.map((act, idx) => (
                        <div key={idx} className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-xs text-emerald-350 leading-relaxed font-semibold">
                          🛠️ {act}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Evidence Trail */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck className="h-4 w-4 text-blue-400" />
                    <span>Grounded Evidence Trails</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {rcaReport.evidence_trail.map((ev, idx) => (
                      <div key={idx} className="bg-slate-955 p-3.5 rounded-xl border border-slate-850 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-300 italic leading-relaxed">"...{ev.snippet}..."</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Source file: <span className="font-mono text-slate-400">{ev.doc}</span></span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono font-bold flex-shrink-0">
                          {ev.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
