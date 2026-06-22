import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Ingestion from './components/Ingestion';
import Chat from './components/Chat';
import GraphViewer from './components/GraphViewer';
import Compliance from './components/Compliance';
import RCA from './components/RCA';
import Simulator from './components/Simulator';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssetTag, setSelectedAssetTag] = useState('');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedAssetTag={setSelectedAssetTag} 
          />
        );
      case 'ingestion':
        return <Ingestion />;
      case 'chat':
        return <Chat />;
      case 'graph':
        return <GraphViewer />;
      case 'compliance':
        return <Compliance />;
      case 'rca':
        return (
          <RCA 
            selectedAssetTag={selectedAssetTag} 
            setSelectedAssetTag={setSelectedAssetTag} 
          />
        );
      case 'simulator':
        return <Simulator />;
      default:
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedAssetTag={setSelectedAssetTag} 
          />
        );
    }
  };

  return (
    <div className="flex bg-[#080c14] min-h-screen text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
