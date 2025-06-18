import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeType as MyNodeType } from '../types';

// Mapa boja za grupe
const groupColorMap: Record<string, string> = {
  'server-00': '#B3E5FC',
  'servers': '#C8E6C9',
  'users': '#FFF9C4',
  'default': '#E0E0E0'
};

// Mapa ikona (kopirana iz stare komponente)
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

const CustomNode = ({ data }: NodeProps<{ label: string; originalNode: MyNodeType }>) => {
  const { label, originalNode } = data;
  const backgroundColor = groupColorMap[originalNode.group || 'default'] || '#E0E0E0';
  const iconUrl = originalNode.icon || iconMap[originalNode.type?.toLowerCase?.()] || '/icons/computer.png';

  return (
    <div style={{
      background: backgroundColor,
      border: '2px solid #555',
      borderRadius: '50%',
      width: '90px',
      height: '90px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '5px',
      color: '#333'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <img src={iconUrl} alt={label} style={{ width: '40px', height: '40px', marginBottom: '5px' }} />
      <div style={{ fontSize: '11px', fontWeight: 'bold', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(CustomNode);