import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckSquare, Square, Calendar, User, FileText } from 'lucide-react';

export default function Compliance() {
  const [summary, setSummary] = useState({
    compliance_score: 100,
    total_rules_checked: 0,
    active_gaps_count: 0,
    compliant_checks_count: 0,
    gaps: []
  });
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState(new Set());

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance/summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskAction) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskAction)) {
        next.delete(taskAction);
      } else {
        next.add(taskAction);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="text-slate-400 text-sm">Compiling plant compliance logs against rules registry...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic compliance score based on checked items
  // If user completes items, we boost the compliance score to demonstrate resolution!
  const totalTasks = summary.gaps.reduce((acc, gap) => acc + gap.corrective_actions.length, 0);
  const completedCount = completedTasks.size;
  const resolvedPct = totalTasks > 0 ? (completedCount / totalTasks) : 0;
  
  const initialScore = summary.compliance_score;
  const currentScore = Math.min(Math.round(initialScore + (100 - initialScore) * resolvedPct), 100);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Compliance Intelligence Agent</h2>
        <p className="text-slate-400 text-sm">Automated regulatory gap detector. Continuously audits procedures and inspection logs against standard compliance rules.</p>
      </div>

      {/* Overview telemetry row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score dial indicator */}
        <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Facility Audit Index</span>
          
          <div className="relative flex items-center justify-center h-32 w-32 mt-4">
            <svg className="absolute w-full h-full transform -rotate-90">
              {/* background ring */}
              <circle cx="64" cy="64" r="54" stroke="#1e293b" strokeWidth="8" fill="transparent" />
              {/* dynamic score ring */}
              <circle 
                cx="64" 
                cy="64" 
                r="54" 
                stroke={currentScore > 80 ? "#10b981" : currentScore > 60 ? "#f59e0b" : "#ef4444"} 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - currentScore / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <span className="text-3xl font-black text-white font-outfit">{currentScore}%</span>
          </div>

          {completedCount > 0 && (
            <p className="text-[10px] text-emerald-400 font-bold mt-3">📈 Score adjusted (+{currentScore - initialScore}% resolved)</p>
          )}
        </div>

        {/* Rules Registry checklist */}
        <div className="glass-panel rounded-xl p-6 md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Checked Plant Regulations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white font-mono">ASME-Sec-VIII (Pressure Safety)</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Annual certifications on pressure valves.</p>
              </div>
            </div>
            
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white font-mono">OSHA-1910.119 (Process Management)</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Procedural reviews and engineer sign-offs.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white font-mono">API-527 (Bypass Valve Seating)</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Bypass valve seating and seal compliance.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white font-mono">EPA-CAA-112r (Stack Emissions)</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Exhaust emission reports logging checks.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Audit findings gap list */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <AlertOctagon className="text-red-500 h-5 w-5 animate-pulse-subtle" />
          <span>Mitigation Task Console ({summary.active_gaps_count} active findings)</span>
        </h3>

        <div className="space-y-6">
          {summary.gaps.map((gap) => (
            <div key={gap.id} className="bg-slate-900/40 rounded-xl p-5 border border-slate-850 flex flex-col md:flex-row md:space-x-6">
              
              {/* Gap Info */}
              <div className="flex-1 space-y-3 pb-4 md:pb-0 md:border-r md:border-slate-800 md:pr-6">
                <div className="flex items-center space-x-2.5">
                  <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded text-[10px] font-extrabold font-mono tracking-wider">{gap.rule_code}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">{gap.category} Violation</span>
                </div>
                <h4 className="text-sm font-extrabold text-white leading-snug">{gap.rule_description}</h4>
                <p className="text-xs text-slate-400 leading-relaxed italic">"{gap.gap_details}"</p>
                
                <div className="flex items-center space-x-2 text-[10.5px] text-slate-500">
                  <FileText className="h-4 w-4 text-slate-650" />
                  <span>Audit Evidence Source: <span className="font-mono text-slate-400">{gap.document_name}</span></span>
                </div>
              </div>

              {/* Corrective Actions check list */}
              <div className="w-full md:w-96 space-y-3">
                <span className="text-[10.5px] font-bold text-slate-500 tracking-wider uppercase block">Required Corrective Tasks</span>
                
                <div className="space-y-2.5">
                  {gap.corrective_actions.map((act, actIdx) => {
                    const isDone = completedTasks.has(act.action);
                    return (
                      <div 
                        key={actIdx}
                        onClick={() => handleToggleTask(act.action)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 select-none ${
                          isDone 
                            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-100' 
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isDone ? (
                            <CheckSquare className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className={`text-xs font-semibold leading-relaxed ${isDone ? 'line-through text-slate-500' : ''}`}>{act.action}</p>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{act.assignee.split(' ')[0]}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due {act.deadline}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
