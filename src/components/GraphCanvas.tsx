// filepath: src/components/GraphCanvas.tsx
import React, { useMemo } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, type Node, type Edge } from 'reactflow';
import type { GraphData, NodeType as MyNodeType } from '../types';
import { getLayoutedElements } from '../services/layout';
import CustomNode from './CustomNode';

// Registriramo naš custom node da ga React Flow može koristiti
const nodeTypes = {
  custom: CustomNode,
};

interface GraphCanvasComponentProps {
  data: GraphData;
  onNodeClick?: (node: MyNodeType) => void;
}

const GraphCanvasComponent: React.FC<GraphCanvasComponentProps> = ({ data, onNodeClick }) => {
  const { nodes, edges } = useMemo(() => {
    if (!data || data.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    const initialNodes: Node[] = data.nodes.map((node) => ({
      id: node.id,
      type: 'custom', // Kažemo React Flow da koristi naš custom node
      position: { x: 0, y: 0 }, // Poziciju će izračunati Dagre
      data: { label: node.label, originalNode: node },
    }));

    const initialEdges: Edge[] = data.edges.map((edge) => {
      const sourcePrefix = edge.source.split('-')[0];
      const targetPrefix = edge.target.split('-')[0];
      
      const isDashed = (sourcePrefix === 'user' || sourcePrefix === 'person' || targetPrefix === 'user' || targetPrefix === 'person') &&
                       (sourcePrefix === 'computer' || targetPrefix === 'computer');
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: {
          strokeDasharray: isDashed ? '5 5' : undefined,
          stroke: '#888',
          strokeWidth: 2,
        },
      };
    });

    // Vraćamo elemente s izračunatim pozicijama
    return getLayoutedElements(initialNodes, initialEdges);

  }, [data]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (onNodeClick && node.data.originalNode) {
      onNodeClick(node.data.originalNode);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        nodesDraggable={true}
      >
        <Controls />
        {/* 2. MIJENJAMO "dots" U BackgroundVariant.Dots */}
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default React.memo(GraphCanvasComponent);