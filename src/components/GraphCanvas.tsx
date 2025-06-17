import React, { useEffect, useRef, useState } from 'react';
import { GraphCanvas } from 'reagraph';
import type { GraphData, NodeType, EdgeType } from '../types';

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
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current?.zoomToFit) {
      ref.current.zoomToFit();
    }
    console.log('Tipovi čvorova:', data.nodes.map((n) => n.type));
  }, [data]);

  return (
    <div>
      <GraphCanvas
        ref={ref}
        nodes={data.nodes}
        edges={data.edges}
        labelType="all"
        layoutType="forceDirected2d"
        groupBy="group"
        layoutOverrides={{
          forces: {
            charge: -200,
            linkDistance: 120,
            collide: 50
          }
        }}
        onNodeClick={(node: NodeType) => {
          const found = data.nodes.find((n) => n.id === node.id);
          if (found && onNodeClick) {
            onNodeClick(found);
          }
        }}
        onNodePointerEnter={(node: NodeType) => {
          if (node.fullName) {
            setHoveredNodeName(node.fullName);
          } else {
            setHoveredNodeName(node.label);
          }
        }}
        onNodePointerLeave={() => setHoveredNodeName(null)}
        nodeStyle={(node: NodeType) => ({
          icon: {
            url: node.icon || iconMap[node.type?.toLowerCase?.()] || '/icons/computer.png',
            size: 24,
          },
          cursor: 'pointer'
        })}
        edgeStyle={(edge: EdgeType, source: NodeType, target: NodeType) => {
          const isComputerToBinary =
            source.type === 'computer' && target.icon === '/icons/binary.png';

          const isBinaryToCustomerOrService =
            source.icon === '/icons/binary.png' &&
            (target.icon === '/icons/customer.png' || target.icon === '/icons/service.png');

          const isUserToComputer =
            source.icon === '/icons/user.png' && target.icon === '/icons/computer.png';
          
          const isDashed = edge.type === 'computer-person' || isUserToComputer;

          return {
            stroke: isComputerToBinary ? 'red' : 'black',
            strokeDasharray: isDashed || isUserToComputer ? '4,2' : '0',
            strokeWidth: 1.5,
          };
        }}
      />

      {/* Ispod grafa, prikaz imena čvora na hover */}
      {hoveredNodeName && (
        <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderTop: '1px solid #ccc' }}>
          <h4>Node name: {hoveredNodeName}</h4>
        </div>
      )}
    </div>
  );
};

export default GraphCanvasComponent;
