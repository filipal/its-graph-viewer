/**
 * Funkcija za pripremu grafa prije prikaza u komponenti.
 * - Svakom čvoru dodaje odgovarajuću ikonu na temelju njegovog tipa.
 * - Ako čvor već ima definiranu `icon` vrijednost, ostavlja je netaknutom.
 * - Ako ne postoji `icon`, traži je u mapiranju `iconMap`, a ako ni tamo nije definirana, koristi defaultnu ikonu za računalo.
 *
 * Ova priprema je važna kako bi se svi čvorovi ispravno prikazivali u Reagraph sučelju,
 * koje očekuje da svaki čvor ima definiranu ikonu za vizualni prikaz.
 */
import type { EdgeType, NodeType } from '../types';
import { iconMap } from './graphUtils'; // obavezno importaj ako već nije

export function prepareGraph(rawData: { nodes: NodeType[]; edges: EdgeType[] }) {
  const enrichedNodes = rawData.nodes.map((node) => {
    return {
      ...node,
      icon: node.icon || iconMap[node.type?.toLowerCase?.()] || '/icons/computer.png', // postavi ikonu na temelju tipa, koristi default ako nije pronađena
    };
  });

  return {
    nodes: enrichedNodes,
    edges: rawData.edges,
  };
}
