export type NodeType = {
  id: string;
  label: string;
  type: 'computer' | 'software' | 'service' | 'person' | 'network' | 'user-service' | string;
  group?: string;
  icon?: string;
  count?: number;
  fullName?: string;
  x?: number;
  y?: number;
};

export type EdgeType = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 
    | 'computer-software'
    | 'software-service'
    | 'software-user-service'
    | 'computer-person'
    | 'network-software'
    | 'network-computer'
    | string;
};

export type GraphData = {
  nodes: NodeType[];
  edges: EdgeType[];
};