import React, { useState, useEffect } from 'react';
import GraphCanvasComponent from './components/GraphCanvas';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import { useSession } from './context/SessionContext';
import type { NodeType } from './types';
import { parseJSONToGraph } from './services/JSONParser';

const App: React.FC = () => {
  const { graphData, setGraphData } = useSession();
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [viewMode, setViewMode] = useState<'landscape' | 'credentials' | 'dataservice' | 'firewalls'>('landscape');
  const [rawJson, setRawJson] = useState<any>(null);
  const [inputJson, setInputJson] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Resetiramo stanje prije učitavanja novih datoteka
    setRawJson(null);
    setInputJson(null);

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            if (file.name.toLowerCase().includes('input')) {
              setInputJson(parsed);
            } else {
              setRawJson(parsed);
            }
          } catch (err) {
            console.error(`❌ Greška kod parsiranja datoteke ${file.name}:`, err);
          }
        }
      };
      reader.readAsText(file);
    });
  };

  // JEDINI EFEKT ZA PARSIRANJE
  // Ovaj useEffect će se pokrenuti samo kada se rawJson, inputJson ili viewMode promijene.
  useEffect(() => {
    // Parsiramo samo ako imamo glavnu JSON datoteku
    if (rawJson) {
      console.log('*** POZIVAM PARSER (useEffect u App.tsx) ***');
      const graph = parseJSONToGraph(rawJson, inputJson);
      setGraphData(graph);
      setSelectedNode(null);
    }
  }, [rawJson, inputJson, viewMode, setGraphData]); // Ovisnosti su ključne

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph-data.json';
    link.click();
  };

  const handleReset = () => {
    setGraphData({ nodes: [], edges: [] });
    setSelectedNode(null);
    setRawJson(null);
    setInputJson(null);
  };

  console.log('PROVJERA PRIJE RENDERIRANJA: Broj čvorova:', graphData?.nodes?.length ?? 0);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '220px', background: '#222', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <Toolbar
          onLoadFile={handleFileUpload}
          onExport={handleExport}
          onReset={handleReset}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <Sidebar selectedNode={selectedNode} onUpdate={() => {}} />
      </div>
      <div style={{ flex: 1, padding: '10px', background: '#181818' }}>
        {graphData && graphData.nodes.length > 0 ? (
          <GraphCanvasComponent
            // Ključno: Nema `key` propa!
            data={graphData}
            onNodeClick={setSelectedNode}
          />
        ) : (
          <div style={{ color: '#fff', textAlign: 'center', marginTop: '2em' }}>
            Učitaj graf za prikaz.
          </div>
        )}
      </div>
    </div>
  );
};

export default App;