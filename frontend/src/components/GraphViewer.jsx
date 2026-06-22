import React, { useEffect, useState, useRef } from 'react';
import { Network, HelpCircle, ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

export default function GraphViewer() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [drilldownActive, setDrilldownActive] = useState(false);
  
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  // Drag states
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      setDrilldownActive(false);
      const res = await fetch('/api/graph/data');
      const data = await res.json();
      setGraphData(data);
      initializeSimulation(data.nodes, data.links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrilldown = async (nodeId) => {
    try {
      setLoading(true);
      setDrilldownActive(true);
      const res = await fetch(`/api/graph/drilldown?node_id=${encodeURIComponent(nodeId)}`);
      const data = await res.json();
      initializeSimulation(data.nodes, data.links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeSimulation = (rawNodes, rawLinks) => {
    // Clone nodes and assign random initial positions near center
    const width = 800;
    const height = 500;
    
    const initializedNodes = rawNodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0
    }));

    // Map links to source/target objects
    const initializedLinks = rawLinks.map((l) => ({
      ...l,
      source: l.source,
      target: l.target
    }));

    setNodes(initializedNodes);
    setLinks(initializedLinks);
  };

  // Basic Physics Force-Directed Loop
  useEffect(() => {
    if (nodes.length === 0) return;

    let active = true;
    const tick = () => {
      if (!active) return;

      // Update positions based on simple force calculations
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map(n => ({ ...n }));
        const nodeMap = {};
        nextNodes.forEach(n => { nodeMap[n.id] = n; });

        const width = 800;
        const height = 500;
        const centerForce = 0.02;
        const repelForce = 350;
        const linkForceStrength = 0.08;
        const linkDistance = 120;

        // 1. Center gravity force
        nextNodes.forEach((n) => {
          if (n.id === draggedNodeId) return;
          n.vx += (width / 2 - n.x) * centerForce;
          n.vy += (height / 2 - n.y) * centerForce;
        });

        // 2. Repulsive force between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          const n1 = nextNodes[i];
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n2 = nextNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);
            if (dist < 280) {
              const force = repelForce / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1.id !== draggedNodeId) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2.id !== draggedNodeId) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 3. Attractive link forces
        links.forEach((link) => {
          const sNode = nodeMap[link.source];
          const tNode = nodeMap[link.target];
          if (!sNode || !tNode) return;

          const dx = tNode.x - sNode.x;
          const dy = tNode.y - sNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const diff = dist - linkDistance;
          
          const fx = (dx / dist) * diff * linkForceStrength;
          const fy = (dy / dist) * diff * linkForceStrength;

          if (sNode.id !== draggedNodeId) {
            sNode.vx += fx;
            sNode.vy += fy;
          }
          if (tNode.id !== draggedNodeId) {
            tNode.vx -= fx;
            tNode.vy -= fy;
          }
        });

        // 4. Update coordinates & apply friction
        nextNodes.forEach((n) => {
          if (n.id === draggedNodeId) return;
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.75; // damping
          n.vy *= 0.75;
          
          // Boundaries constraints
          n.x = Math.max(20, Math.min(width - 20, n.x));
          n.y = Math.max(20, Math.min(height - 20, n.y));
        });

        return nextNodes;
      });

      requestAnimationFrame(tick);
    };

    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [nodes.length, links, draggedNodeId]);

  // Drag interaction handlers
  const handleMouseDown = (node, e) => {
    setDraggedNodeId(node.id);
    setSelectedNode(node);
  };

  const handleMouseMove = (e) => {
    if (!draggedNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === draggedNodeId ? { ...n, x, y, vx: 0, vy: 0 } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  // Node Color Mapper
  const getNodeColor = (type) => {
    switch (type) {
      case 'EQUIPMENT': return '#3b82f6'; // Blue
      case 'FAILURE': return '#ef4444'; // Red
      case 'REGULATION': return '#f59e0b'; // Amber
      case 'PERSON': return '#10b981'; // Green
      case 'PROCEDURE': return '#a855f7'; // Purple
      default: return '#64748b'; // Slate gray
    }
  };

  // Filter nodes according to selection dropdown
  const filteredNodes = nodes.filter(n => filterType === 'ALL' || n.type === filterType);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredLinks = links.filter(l => 
    filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Asset Knowledge Graph</h2>
          <p className="text-slate-400 text-sm">Interactive network mapping connections between plant equipment, regulations, personnel, and historic failures.</p>
        </div>
        <div className="flex space-x-2">
          {drilldownActive && (
            <button 
              onClick={fetchGraph}
              className="bg-slate-800 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700 flex items-center space-x-1.5 border border-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Full Graph</span>
            </button>
          )}
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-750 text-slate-300 text-xs px-3.5 py-2 rounded-lg font-semibold outline-none"
          >
            <option value="ALL">Show All Nodes</option>
            <option value="EQUIPMENT">Equipment Nodes</option>
            <option value="FAILURE">Failures / Defects</option>
            <option value="REGULATION">Regulatory References</option>
            <option value="PERSON">Personnel</option>
            <option value="PROCEDURE">SOPs</option>
          </select>
        </div>
      </div>

      {/* Main panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SVG Graph Visualizer (Left 3 Columns) */}
        <div className="lg:col-span-3 glass-panel rounded-xl overflow-hidden relative min-h-[500px] bg-slate-950/40">
          
          {/* Helper overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/80 px-3 py-2 rounded border border-slate-800 text-[10.5px] text-slate-400 flex items-center space-x-1.5">
            <HelpCircle className="h-4 w-4 text-amber-500" />
            <span>Drag nodes to align layout. Double-click any node to drill down into neighbors.</span>
          </div>

          {loading ? (
            <div className="absolute inset-0 bg-slate-950/60 z-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              <p className="text-slate-400 text-xs">Computing topological layout coordinates...</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="500"
              viewBox="0 0 800 500"
              className="select-none cursor-grab"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Relationship Links (Edges) */}
              <g>
                {filteredLinks.map((link, idx) => {
                  const sourceNode = nodes.find(n => n.id === link.source);
                  const targetNode = nodes.find(n => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="#334155"
                        strokeWidth="1.5"
                        strokeDasharray={link.type === 'REQUIRES_COMPLIANCE' ? '4 4' : 'none'}
                      />
                      
                      {/* Optional Relationship Label mid-point */}
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2 - 4}
                        fill="#475569"
                        fontSize="8px"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="bg-slate-950 px-1"
                      >
                        {link.type}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Node Circles */}
              <g>
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const color = getNodeColor(node.type);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => handleMouseDown(node, e)}
                      onDoubleClick={() => handleDrilldown(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Highlight Outer Ring */}
                      <circle
                        r="20"
                        fill="transparent"
                        stroke={isSelected ? '#f59e0b' : color}
                        strokeWidth={isSelected ? '2.5' : '0'}
                        className="group-hover:stroke-amber-500/40 group-hover:stroke-2 transition-all"
                      />
                      
                      {/* Solid Center */}
                      <circle
                        r="11"
                        fill={color}
                        className="shadow-md"
                      />

                      {/* Label Text */}
                      <text
                        y="28"
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="10px"
                        fontWeight="bold"
                        className="font-outfit pointer-events-none drop-shadow"
                      >
                        {node.name}
                      </text>

                      {/* Type sub-tag */}
                      <text
                        y="38"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="7.5px"
                        fontWeight="bold"
                        className="uppercase pointer-events-none"
                      >
                        {node.type}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Node Properties Panel (Right 1 Column) */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <div className="glass-panel rounded-xl p-5 space-y-5 h-full flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-extrabold text-slate-500 tracking-wider">Node metadata</span>
                <div className="flex items-center space-x-2.5 mt-2 pb-3 border-b border-slate-800">
                  <span 
                    className="h-3.5 w-3.5 rounded-full" 
                    style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                  ></span>
                  <div>
                    <h3 className="text-base font-extrabold text-white font-outfit">{selectedNode.name}</h3>
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">{selectedNode.type}</span>
                  </div>
                </div>

                {/* Properties fields lists */}
                <div className="space-y-3.5 mt-4 text-xs">
                  {Object.entries(selectedNode.properties).map(([key, val]) => (
                    <div key={key} className="bg-slate-900/60 p-2.5 rounded border border-slate-850">
                      <span className="text-[9.5px] text-slate-500 uppercase font-bold tracking-wider block">{key.replace('_', ' ')}</span>
                      <span className="text-slate-300 font-semibold mt-1 block">
                        {typeof val === 'number' && key.includes('index') ? `${val}%` : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedNode.type === 'EQUIPMENT' && (
                <div className="pt-4 border-t border-slate-800/80 mt-4">
                  <button 
                    onClick={() => handleDrilldown(selectedNode.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-lg text-xs tracking-wider uppercase border border-slate-700 flex items-center justify-center space-x-2"
                  >
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span>Expand Neighbors</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-5 text-center text-slate-500 italic h-full flex items-center justify-center min-h-[250px]">
              Click any graph node to inspect metadata and properties.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const Loader2 = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
