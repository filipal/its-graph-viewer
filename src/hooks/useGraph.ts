import { useSession } from '../context/SessionContext';
import type { NodeType, EdgeType } from '../types';

export const useGraph = () => {
  const { graphData, setGraphData } = useSession();

  const addNode = (node: NodeType) => {
    setGraphData({
      ...graphData,
      nodes: [...graphData.nodes, node],
    });
  };

  const addEdge = (edge: EdgeType) => {
    setGraphData({
      ...graphData,
      edges: [...graphData.edges, edge],
    });
  };

  const updateNode = (updatedNode: NodeType) => {
    setGraphData({
      ...graphData,
      nodes: graphData.nodes.map(node =>
        node.id === updatedNode.id ? updatedNode : node
      ),
    });
  };

  const updateEdge = (updatedEdge: EdgeType) => {
    setGraphData({
      ...graphData,
      edges: graphData.edges.map(edge =>
        edge.id === updatedEdge.id ? updatedEdge : edge
      ),
    });
  };

  return {
    graphData,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
  };
};
