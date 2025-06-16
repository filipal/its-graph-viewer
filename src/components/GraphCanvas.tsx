import React, { useEffect, useRef } from 'react';
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
  // Dodaj ovdje još tipova ako ih imaš u parseru
};



interface GraphCanvasComponentProps {
  data: GraphData;
  onNodeClick?: (node: NodeType) => void;
}

const GraphCanvasComponent: React.FC<GraphCanvasComponentProps> = ({ data, onNodeClick }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current?.zoomToFit) {
      ref.current.zoomToFit();
    }
    console.log('Prikaz tipova čvorova:', data.nodes.map((n) => n.type));
  }, [data]);

  return (
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
      nodeStyle={(node: NodeType) => ({
        icon: {
          url: iconMap[node.type?.toLowerCase?.()] || '/icons/computer.png',
          size: 24
        }
      })}
      edgeStyle={(edge: EdgeType, source: NodeType, target: NodeType) => {
        // 1. Odnosi temeljeni na tipu veze
        const isRed = edge.type === 'computer-software';
        const isDashed = edge.type === 'computer-person';

        // 2. Odnosi temeljeni na ikonama (dopunska logika)
        const isComputerToBinary =
          source.type === 'computer' && target.icon === '/icons/binary.png';

        const isBinaryToCustomerOrService =
          source.icon === '/icons/binary.png' &&
          (target.icon === '/icons/customer.png' || target.icon === '/icons/service.png');

        const isUserToComputer =
          source.icon === '/icons/user.png' && target.icon === '/icons/computer.png';

        return {
          stroke: isComputerToBinary || isRed ? 'red' : 'black',
          strokeDasharray: isDashed || isUserToComputer ? '4,2' : '0',
          strokeWidth: 1.5,
        };
      }}
    />
  );
};

export default GraphCanvasComponent;
