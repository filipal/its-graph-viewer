import React, { useState } from 'react';
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
  const [rawJson, setRawJson] = useState<any>(null); // Dodano za ponovno parsiranje

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          setRawJson(parsed); // Spremi originalni JSON
          const graph = parseJSONToGraph(parsed, viewMode);
          setGraphData(graph);
        } catch (err) {
          console.error('Neispravan JSON:', err);
        }
      }
    };
    reader.readAsText(file);
  };

  // Kad se promijeni viewMode, ponovno parsiraj isti JSON (ako postoji)
  React.useEffect(() => {
    if (rawJson) {
      const graph = parseJSONToGraph(rawJson, viewMode);
      setGraphData(graph);
      setSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

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
  };

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
        {graphData.nodes.length > 0 ? (
          <GraphCanvasComponent
            key={JSON.stringify(graphData)}
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
