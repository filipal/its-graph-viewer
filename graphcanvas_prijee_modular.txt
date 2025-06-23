import React, { useEffect, useRef, useState } from 'react';
import { GraphCanvas } from 'reagraph';
import type { GraphData, NodeType, EdgeType } from '../types';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import Graph from 'graphology';

function applyForceAtlasLayout(data: GraphData): GraphData {
  const graph = new Graph();
  data.nodes.forEach((node) => graph.addNode(node.id, { ...node }));
  data.edges.forEach((edge) => graph.addEdge(edge.source, edge.target));

  forceAtlas2.assign(graph, {
    iterations: 100,
    settings: {
      gravity: 1,
      scalingRatio: 10,
      slowDown: 1
    }
  });

  const nodesWithPosition = data.nodes.map((node) => {
    const { x, y } = graph.getNodeAttributes(node.id);
    return { ...node, x, y, z: 0 };
  });

  return {
    nodes: nodesWithPosition,
    edges: data.edges
  };
}

function shiftConnectedNodes(graphData: GraphData, nodeId: string, shiftX = 300, shiftY = 0): GraphData {
  const graph = new Graph();

  // Napravi graf
  graphData.nodes.forEach((node) => graph.addNode(node.id));
  graphData.edges.forEach((edge) => graph.addEdge(edge.source, edge.target));

  // Pronađi samo direktne susjede + taj jedan čvor
  const group = new Set<string>();
  group.add(nodeId);
  graph.forEachNeighbor(nodeId, (neighbor) => group.add(neighbor));

  // Pomakni samo označene
  const updatedNodes = graphData.nodes.map((node) =>
    group.has(node.id)
      ? { ...node, x: (node.x || 0) + shiftX, y: (node.y || 0) + shiftY }
      : node
  );

  return {
    nodes: updatedNodes,
    edges: graphData.edges
  };
}


function getGroupColor(group: string | undefined): string {
  const colorMap: Record<string, string> = {
    'server-00': '#B3E5FC',
    'servers': '#C8E6C9',
    'users': '#FFF9C4',
    'default': '#E0E0E0'
  };
  return group && colorMap[group] ? colorMap[group] : colorMap['default'];
}

const iconMap: Record<string, string> = {
  user: '/icons/user.png',
  'user-service': '/icons/customer.png',
  lock: '/icons/lock.png',
  key: '/icons/key.png',
  computer: '/icons/computer.png',
  binary: '/icons/binary.png',
  database: '/icons/database.png',
  internet: '/icons/internet.png',
  service: '/icons/service.png',
  software: '/icons/binary.png',
  customer: '/icons/customer.png'
};

interface GraphCanvasComponentProps {
  data: GraphData;
  onNodeClick?: (node: NodeType) => void;
}

const GraphCanvasComponent: React.FC<GraphCanvasComponentProps> = ({ data, onNodeClick }) => {
  const ref = useRef<any>(null);
  const [layoutedData, setLayoutedData] = useState<GraphData>(() => applyForceAtlasLayout(data));
  const [hoveredNode, setHoveredNode] = useState<NodeType | null>(null);
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);
  // Dodatne state varijable za filtere
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const groups = Array.from(
      new Set(data.nodes.map((n) => n.group).filter((g): g is string => !!g && g !== 'default'))
    );
    setAvailableGroups(groups);

    const types = Array.from(new Set(data.nodes.map((n) => n.type).filter((t): t is string => !!t)));
    setAvailableTypes(types);

    const layouted = applyForceAtlasLayout(data); // spremi rezultat
    console.log('Broj bridova (edges):', layouted.edges.length);

    setLayoutedData(layouted);

    /* setLayoutedData(applyForceAtlasLayout(data)); */
    setTimeout(() => ref.current?.zoomToFit?.(), 200);
  }, [data]);

  const filterGraph = () => {
    let filteredNodes = data.nodes;

    if (selectedGroup) {
      const groupNodeIds = new Set(
        data.nodes.filter((n) => n.group === selectedGroup).map((n) => n.id)
      );
      const relatedNodeIds = new Set<string>(groupNodeIds);

      let added = true;
      while (added) {
        added = false;
        data.edges.forEach((edge) => {
          if (relatedNodeIds.has(edge.source) && !relatedNodeIds.has(edge.target)) {
            relatedNodeIds.add(edge.target);
            added = true;
          }
          if (relatedNodeIds.has(edge.target) && !relatedNodeIds.has(edge.source)) {
            relatedNodeIds.add(edge.source);
            added = true;
          }
        });
      }

      filteredNodes = data.nodes.filter((n) => relatedNodeIds.has(n.id));
    }

    if (selectedTypes.size > 0) {
      filteredNodes = filteredNodes.filter((n) => selectedTypes.has(n.type));
    }

    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target));

    setLayoutedData({ nodes: filteredNodes, edges: filteredEdges });
  };

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    newSet.has(type) ? newSet.delete(type) : newSet.add(type);
    setSelectedTypes(newSet);
  };

  useEffect(() => {
    filterGraph();
  }, [selectedGroup, selectedTypes]);




/*   const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('Right click at', e.clientX, e.clientY);
    // Mjesto za context menu u editoru kasnije
  }; */

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: '#fff', padding: '0.5rem', borderRadius: 8 }}>
        <label>Grupa: </label>
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
          <option value="">-- sve --</option>
          {availableGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <div style={{ marginTop: '0.5rem' }}>
          <label>Tipovi:</label><br />
          {availableTypes.map((type) => (
            <label key={type} style={{ marginRight: '0.5rem' }}>
              <input type="checkbox" checked={selectedTypes.has(type)} onChange={() => toggleType(type)} /> {type}
            </label>
          ))}
        </div>
      </div>

      <GraphCanvas
        ref={ref}
        nodes={layoutedData.nodes}
        edges={layoutedData.edges}
        draggable
        layoutType="forceDirected2d"
        edgeArrowPosition="none"
        nodeStyle={(node: NodeType) => ({
          fill: getGroupColor(node.group),
          icon: {
            url: node.icon || iconMap[node.type?.toLowerCase?.()] || '/icons/computer.png',
            size: 48
          },
          label: { color: '#2A2C34', fontSize: 16, fontWeight: 'bold' },
          borderRadius: 12, padding: 6, cursor: 'pointer'
        })}
        edgeStyle={(_edge: EdgeType, source: NodeType, target: NodeType) => {
          console.log('SOURCE:', source.type, 'TARGET:', target.type);
          let stroke = 'black';
          let strokeDasharray = '0';

          if ((source.type === 'user' && target.type === 'computer') || (source.type === 'computer' && target.type === 'user')) {
            stroke = 'black';
            strokeDasharray = '4 2';
          } else if (source.type === 'computer' && target.type === 'software') {
            stroke = 'red';
          } else if (source.group === target.group) {
            stroke = 'green';
          } else if (source.type === 'lock' || target.type === 'lock') {
            stroke = 'blue';
          }
          
          return {
            stroke,
            strokeDasharray,
            strokeWidth: 2
          };
        }}
        onNodeClick={(node: NodeType) => {
          if (node.type === 'computer') setSelectedComputerId(node.id);
          if (onNodeClick) onNodeClick(node);
        }}
        onNodePointerEnter={(node: NodeType) => setHoveredNode(node)}
        onNodePointerLeave={() => setHoveredNode(null)}
      />

      {selectedComputerId && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: '0.5rem', borderRadius: '8px', boxShadow: '0 0 6px rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
            <button onClick={() => setLayoutedData(shiftConnectedNodes(layoutedData, selectedComputerId, 0, -100))}>↑</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setLayoutedData(shiftConnectedNodes(layoutedData, selectedComputerId, -100, 0))}>←</button>
            <button onClick={() => setLayoutedData(shiftConnectedNodes(layoutedData, selectedComputerId, 500, 0))}>→</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.3rem' }}>
            <button onClick={() => setLayoutedData(shiftConnectedNodes(layoutedData, selectedComputerId, 0, 100))}>↓</button>
          </div>
        </div>
      )}

      {hoveredNode && (
        <div style={{ position: 'absolute', left: 10, bottom: 10, background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', boxShadow: '0 0 6px rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <strong>{hoveredNode.fullName || hoveredNode.label}</strong><br />
          <small>ID: {hoveredNode.id}</small><br />
          <small>Tip: {hoveredNode.type}</small><br />
          <small>Grupa: {hoveredNode.group}</small>
        </div>
      )}
    </div>
  );
};

export default GraphCanvasComponent;

