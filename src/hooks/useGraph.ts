/**
 * Custom hook: useGraph
 *
 * Ovaj hook služi kao pomoćna apstrakcija za manipulaciju podacima grafa unutar aplikacije.
 * Koristi podatke iz globalnog konteksta `SessionContext` (putem useSession hooka),
 * te omogućuje dodavanje i ažuriranje čvorova i rubova.
 *
 * Ključno: Hook centralizira sve izmjene nad grafom kako bi se izbjeglo direktno manipuliranje podacima izvan dozvoljenog konteksta.
 */
import { useSession } from '../context/SessionContext'; // pristup globalnom stanju grafa
import type { NodeType, EdgeType } from '../types';

/**
 * Hook koji vraća trenutno stanje grafa i pomoćne funkcije za njegovo ažuriranje.
 */
export const useGraph = () => {
  const { graphData, setGraphData } = useSession(); // dohvat trenutnog grafa iz konteksta
  /**
   * Dodaje novi čvor u graf.
   */
  const addNode = (node: NodeType) => {
    setGraphData({
      ...graphData,
      nodes: [...graphData.nodes, node],
    });
  };
  /**
   * Dodaje novi rub (edge) u graf.
   */
  const addEdge = (edge: EdgeType) => {
    setGraphData({
      ...graphData,
      edges: [...graphData.edges, edge],
    });
  };
  /**
   * Ažurira postojeći čvor prema ID-u.
   */
  const updateNode = (updatedNode: NodeType) => {
    setGraphData({
      ...graphData,
      nodes: graphData.nodes.map(node =>
        node.id === updatedNode.id ? updatedNode : node
      ),
    });
  };
  /**
   * Ažurira postojeći rub prema ID-u.
   */
  const updateEdge = (updatedEdge: EdgeType) => {
    setGraphData({
      ...graphData,
      edges: graphData.edges.map(edge =>
        edge.id === updatedEdge.id ? updatedEdge : edge
      ),
    });
  };
  // Vraća trenutno stanje grafa i funkcije za manipulaciju
  return {
    graphData,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
  };
};
