// graphUtils.ts
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData, NodeType, EdgeType } from '../types';

export type GraphDataWithResolvedEdges = {
  nodes: NodeType[];
  edges: (Omit<EdgeType, 'source' | 'target'> & { source: NodeType; target: NodeType })[];
};

export type EdgeWithNodes = Omit<EdgeType, 'source' | 'target'> & {
  source: NodeType;
  target: NodeType;
};

export function simplifyGraph(data: GraphDataWithResolvedEdges): GraphData {
  return {
    nodes: data.nodes,
    edges: data.edges.map(edge => ({
      ...edge,
      source: edge.source.id,
      target: edge.target.id
    }))
  };
}


export function applyForceAtlasLayout(data: GraphData): { nodes: NodeType[]; edges: EdgeWithNodes[] } {
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

  const nodesWithPosition: NodeType[] = data.nodes.map((node) => {
    const { x, y } = graph.getNodeAttributes(node.id);
    return { ...node, x, y, z: 0 };
  });

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  const edgesWithObjects: EdgeWithNodes[] = data.edges
    .map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) return null;
      return {
        ...edge,
        source: sourceNode,
        target: targetNode
      };
    })
    .filter(Boolean) as EdgeWithNodes[];

  return {
    nodes: nodesWithPosition,
    edges: edgesWithObjects
  };
}

export function resolveEdgeNodes(data: GraphData): GraphDataWithResolvedEdges {
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
  const resolvedEdges = data.edges
    .map((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return null;
      return {
        ...edge,
        source,
        target
      };
    })
    .filter((e): e is EdgeWithNodes => !!e);

  return { nodes: data.nodes, edges: resolvedEdges };
}

export function shiftConnectedNodes(graphData: GraphData, nodeId: string, shiftX = 300, shiftY = 0): GraphData {
  const graph = new Graph();
  graphData.nodes.forEach((node) => graph.addNode(node.id));
  graphData.edges.forEach((edge) => graph.addEdge(edge.source, edge.target));

  const group = new Set<string>();
  group.add(nodeId);
  graph.forEachNeighbor(nodeId, (neighbor) => group.add(neighbor));

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

export function getGroupColor(group: string | undefined): string {
  const colorMap: Record<string, string> = {
    'server-00': '#B3E5FC',
    'servers': '#C8E6C9',
    'users': '#FFF9C4',
    'default': '#E0E0E0'
  };
  return group && colorMap[group] ? colorMap[group] : colorMap['default'];
}

export const iconMap: Record<string, string> = {
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
