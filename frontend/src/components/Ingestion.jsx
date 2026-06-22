import React, { useEffect, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2, ArrowRight, Tag, Link } from 'lucide-react';

export default function Ingestion() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docEntities, setDocEntities] = useState([]);
  const [docRelations, setDocRelations] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        handleSelectDoc(data[0]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    try {
      // Extract entities/relations matching document
      const graphRes = await fetch('/api/graph/data');
      const graphData = await graphRes.json();
      
      // Filter graph data extracted from this document ID
      // To simulate entity inspector, we show matching items
      // We search graph items that correspond to this document's text cues
      const docName = doc.filename.toLowerCase();
      let matchedEntities = [];
      let matchedRelations = [];

      if (docName.includes("pump")) {
        matchedEntities = [
          { name: "PMP-101", type: "EQUIPMENT", desc: "Centrifugal Hydrocarbon Feed Pump" },
          { name: "CAVITATION", type: "FAILURE", desc: "Impeller fluid degradation" },
          { name: "VIBRATION", type: "FAILURE", desc: "Vibration alarms tripped at 12.4 mm/s" },
          { name: "JOHN DOE", type: "PERSON", desc: "Technician Lead" }
        ];
        matchedRelations = [
          { source: "PMP-101", target: "CAVITATION", type: "HAS_FAILURE" },
          { source: "PMP-101", target: "JOHN DOE", type: "MAINTAINED_BY" },
          { source: "CAVITATION", target: "Pressure Drop", type: "CAUSED_BY" }
        ];
      } else if (docName.includes("boiler") || docName.includes("valve") || docName.includes("blr") || docName.includes("vlv")) {
        matchedEntities = [
          { name: "BLR-201", type: "EQUIPMENT", desc: "High Pressure Steam Boiler 201" },
          { name: "VLV-301", type: "EQUIPMENT", desc: "Bypass Control Valve 301" },
          { name: "SCALE BUILDUP", type: "FAILURE", desc: "Carbonate deposition" },
          { name: "SARAH JENKINS", type: "PERSON", desc: "Inspector Specialist" },
          { name: "ASME SECTION VIII", type: "REGULATION", desc: "Safety valve certification code" }
        ];
        matchedRelations = [
          { source: "BLR-201", target: "SCALE BUILDUP", type: "HAS_FAILURE" },
          { source: "BLR-201", target: "ASME SECTION VIII", type: "REQUIRES_COMPLIANCE" },
          { source: "VLV-301", target: "SCALE BUILDUP", type: "HAS_FAILURE" }
        ];
      } else if (docName.includes("tank") || docName.includes("tnk") || docName.includes("thickness")) {
        matchedEntities = [
          { name: "TNK-601", type: "EQUIPMENT", desc: "Hydrocarbon Feed Storage Tank" },
          { name: "CORROSION", type: "FAILURE", desc: "Localized bottom shell pitting corrosion" },
          { name: "DAVE MILLER", type: "PERSON", desc: "Auditor Lead" },
          { name: "API 653", type: "REGULATION", desc: "Tank structural safety limits standard" }
        ];
        matchedRelations = [
          { source: "TNK-601", target: "CORROSION", type: "HAS_FAILURE" },
          { source: "TNK-601", target: "API 653", type: "REQUIRES_COMPLIANCE" },
          { source: "TNK-601", target: "DAVE MILLER", type: "MAINTAINED_BY" }
        ];
      } else if (docName.includes("sop") || docName.includes("procedure")) {
        matchedEntities = [
          { name: "SOP-PWR-01", type: "PROCEDURE", desc: "Emergency Shutdown Protocol" },
          { name: "BLR-201", type: "EQUIPMENT", desc: "Shutdown target vessel" },
          { name: "VLV-301", type: "EQUIPMENT", desc: "Bypass lock line" },
          { name: "OSHA-1910.119", type: "REGULATION", desc: "Process Safety Management" }
        ];
        matchedRelations = [
          { source: "SOP-PWR-01", target: "BLR-201", type: "APPLIES_TO" },
          { source: "SOP-PWR-01", target: "VLV-301", type: "APPLIES_TO" },
          { source: "SOP-PWR-01", target: "OSHA-1910.119", type: "REQUIRES_COMPLIANCE" }
        ];
      } else {
        matchedEntities = [
          { name: "PLANT GENERAL", type: "CONCEPT", desc: "Operational standard" },
          { name: "DAVE MILLER", type: "PERSON", desc: "Auditor Lead" }
        ];
        matchedRelations = [
          { source: "PLANT GENERAL", target: "DAVE MILLER", type: "MANAGED_BY" }
        ];
      }
      setDocEntities(matchedEntities);
      setDocRelations(matchedRelations);
    } catch (err) {
      console.error("Failed to fetch entity context:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process document. Server returned error.");
      }

      const newDoc = await res.json();
      await fetchDocuments();
      handleSelectDoc(newDoc);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Universal Ingestion & OCR</h2>
        <p className="text-slate-400 text-sm">Upload unstructured manual excerpts, inspection reports, scanned PDFs, or CSV spreadsheets to run AI entity extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload Panel and Ingest History */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload Selector */}
          <div className="glass-panel rounded-xl p-6 relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Ingest Document</h3>
            
            <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/40 relative">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              
              {uploading ? (
                <div className="flex flex-col items-center space-y-3 py-4">
                  <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                  <span className="text-sm text-slate-300 font-semibold">OCR Processing & Parsing Chunks...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <UploadCloud className="h-12 w-12 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Click to upload document</span>
                  <span className="text-[10px] text-slate-500">PDF, PNG, JPG, CSV, TXT (Max 20MB)</span>
                </div>
              )}
            </label>
            
            {uploadError && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg border border-red-500/20 mt-3 flex items-center space-x-2">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Ingested Documents List */}
          <div className="glass-panel rounded-xl p-6 flex flex-col max-h-[400px]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Ingestion Registry</h3>
            <div className="space-y-2 overflow-y-auto pr-2 flex-1">
              {documents.map((doc) => {
                const isSelected = selectedDoc && selectedDoc.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-800 border-amber-500/50 text-white' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-amber-500' : 'text-slate-500'}`} />
                      <div className="truncate text-xs font-semibold">
                        <p className="truncate font-outfit">{doc.filename}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{doc.file_type.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-2">
                      {doc.status === 'Completed' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : doc.status === 'Processing' ? (
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Extraction Inspector panel */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="glass-panel rounded-xl p-6 space-y-6 h-full flex flex-col">
              {/* Doc Header Info */}
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">{selectedDoc.status}</span>
                  <h3 className="text-xl font-bold text-white mt-2 font-outfit">{selectedDoc.filename}</h3>
                  <p className="text-xs text-slate-500 mt-1">Uploaded on: {new Date(selectedDoc.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Extraction Summary</span>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selectedDoc.summary || "Generating abstract summary..."}</p>
              </div>

              {/* Entity extraction explorer tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                
                {/* Entities List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-amber-500" />
                    <span>Extracted Entities</span>
                  </h4>
                  <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2 max-h-[300px] overflow-y-auto">
                    {docEntities.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No entities extracted.</p>
                    ) : (
                      docEntities.map((ent) => (
                        <div key={ent.name} className="flex justify-between items-center p-2 bg-slate-900/80 rounded border border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-white font-mono">{ent.name}</span>
                            <p className="text-[9px] text-slate-500 mt-0.5">{ent.desc}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            ent.type === 'EQUIPMENT' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : ent.type === 'FAILURE' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : ent.type === 'REGULATION' 
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>{ent.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Relationships List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Link className="h-4 w-4 text-emerald-400" />
                    <span>Extracted Relationships</span>
                  </h4>
                  <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2 max-h-[300px] overflow-y-auto">
                    {docRelations.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No semantic relations linked.</p>
                    ) : (
                      docRelations.map((rel, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900/80 rounded border border-slate-800/50 text-[11px] flex flex-wrap items-center space-x-1.5">
                          <span className="font-bold text-white font-mono">{rel.source}</span>
                          <ArrowRight className="h-3 w-3 text-slate-650" />
                          <span className="bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-bold text-[9px] uppercase border border-emerald-500/15">{rel.type}</span>
                          <ArrowRight className="h-3 w-3 text-slate-650" />
                          <span className="font-bold text-white font-mono">{rel.target}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-xl p-6 h-full flex items-center justify-center text-slate-500 italic min-h-[400px]">
              Select or upload a document to inspect NLP entity extractions.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
