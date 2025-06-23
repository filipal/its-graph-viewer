import React, { useEffect, useRef, useState } from 'react';
import { GraphCanvas } from 'reagraph';
import type { GraphData, NodeType, EdgeType } from '../types';
import type { GraphDataWithResolvedEdges } from '../utils/graphUtils';
import {
  applyForceAtlasLayout,
  resolveEdgeNodes,
  shiftConnectedNodes,
  getGroupColor,
  iconMap,
  simplifyGraph
} from '../utils/graphUtils';

interface GraphCanvasComponentProps {
  data: GraphData;
  onNodeClick?: (node: NodeType) => void;
}

const GraphCanvasComponent: React.FC<GraphCanvasComponentProps> = ({ data, onNodeClick }) => {
  const ref = useRef<any>(null);
  const [layoutedData, setLayoutedData] = useState<GraphDataWithResolvedEdges>(() => {
    const rawLayouted = applyForceAtlasLayout(data);
    return resolveEdgeNodes({ nodes: rawLayouted.nodes, edges: rawLayouted.edges.map(e => ({ ...e, source: e.source.id, target: e.target.id })) });
  });
  const [hoveredNode, setHoveredNode] = useState<NodeType | null>(null);
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const groups = Array.from(new Set(data.nodes.map(n => n.group).filter((g): g is string => !!g && g !== 'default')));
    setAvailableGroups(groups);

    const types = Array.from(new Set(data.nodes.map(n => n.type).filter((t): t is string => !!t)));
    setAvailableTypes(types);

    const layouted = applyForceAtlasLayout(data);
    const resolved = resolveEdgeNodes({ nodes: layouted.nodes, edges: layouted.edges.map(e => ({ ...e, source: e.source.id, target: e.target.id })) });
    setLayoutedData(resolved);
    setTimeout(() => ref.current?.zoomToFit?.(), 200);
  }, [data]);

  const filterGraph = () => {
    let filteredNodes = data.nodes;

    // 1. Ako je odabrana grupa
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

    // 2. Ako su odabrani tipovi – filtriraj po tipu
    if (selectedTypes.size > 0) {
      filteredNodes = filteredNodes.filter((n) => selectedTypes.has(n.type));
    }

    // 3. ID-jevi trenutnih čvorova
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter(
      (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
    );

    // 4. Dodaj virtualne veze ako treba
    const extraEdges: EdgeType[] = [];
    /* const allNodes = new Map(data.nodes.map((n) => [n.id, n])); */

    // user → software ako je computer isključen
    if (selectedTypes.has('user') && selectedTypes.has('software') && !selectedTypes.has('computer')) {
      filteredNodes.forEach((user) => {
        if (user.type !== 'user') return;
        const computerId = user.id.replace('user-', '');

        filteredNodes.forEach((soft) => {
          if (soft.type === 'software' && soft.id.startsWith(computerId)) {
            extraEdges.push({
              id: `virtual-${user.id}-${soft.id}`,
              source: user.id,
              target: soft.id,
              type: 'user-software-virtual'
            });
          }
        });
      });
    }

    // software → service i software → user-service
    if (selectedTypes.has('software')) {
      filteredNodes.forEach((soft) => {
        if (soft.type !== 'software') return;
        filteredNodes.forEach((other) => {
          if ((other.type === 'service' || other.type === 'user-service') &&
            other.id.includes(soft.id)) {
            extraEdges.push({
              id: `virtual-${soft.id}-${other.id}`,
              source: soft.id,
              target: other.id,
              type: 'software-sub-virtual'
            });
          }
        });
      });
    }

    // user → service/user-service (transitivno) ako je software selektiran
    if (selectedTypes.has('user') && selectedTypes.has('software') && (selectedTypes.has('service') || selectedTypes.has('user-service'))) {
      filteredNodes.forEach((user) => {
        if (user.type !== 'user') return;
        const computerId = user.id.replace('user-', '');

        filteredNodes.forEach((soft) => {
          if (soft.type === 'software' && soft.id.startsWith(computerId)) {
            filteredNodes.forEach((other) => {
              if ((other.type === 'service' || other.type === 'user-service') && other.id.includes(soft.id)) {
                extraEdges.push({
                  id: `virtual-${user.id}-${other.id}`,
                  source: user.id,
                  target: other.id,
                  type: 'user-to-leaf-virtual'
                });
              }
            });
          }
        });
      });
    }

    const allEdges = [...filteredEdges, ...extraEdges];

    // 5. Ako nema rezultata – resetiraj prikaz
    if (filteredNodes.length === 0) {
      console.warn('Nema čvorova za prikaz – resetiram prikaz.');
      const layouted = applyForceAtlasLayout(data);
      const resolved = resolveEdgeNodes({
        nodes: layouted.nodes,
        edges: layouted.edges.map(e => ({
          ...e,
          source: e.source.id,
          target: e.target.id,
        })),
      });
      setLayoutedData(resolved);
      return;
    }

    // 6. Inače – layout filtriranih podataka
    const layouted = applyForceAtlasLayout({ nodes: filteredNodes, edges: allEdges });
    const resolved = resolveEdgeNodes({
      nodes: layouted.nodes,
      edges: layouted.edges.map(e => ({
        ...e,
        source: e.source.id,
        target: e.target.id,
      })),
    });
    setLayoutedData(resolved);
  };




  useEffect(() => {
    filterGraph();
  }, [selectedGroup, selectedTypes]);

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    newSet.has(type) ? newSet.delete(type) : newSet.add(type);
    setSelectedTypes(newSet);
  };

  console.log('Rendering GraphCanvas:', layoutedData.nodes.length, 'nodes,', layoutedData.edges.length, 'edges');

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
        edges={layoutedData.edges.map(e => ({
          ...e,
          source: e.source.id,
          target: e.target.id
        }))}
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

          return { stroke, strokeDasharray, strokeWidth: 2 };
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
            <button onClick={() => {
              const updated = shiftConnectedNodes(simplifyGraph(layoutedData), selectedComputerId, 0, -100);
              setLayoutedData(resolveEdgeNodes(updated));
            }}>↑</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => {
              const updated = shiftConnectedNodes(simplifyGraph(layoutedData), selectedComputerId, -100, 0);
              setLayoutedData(resolveEdgeNodes(updated));
            }}>←</button>
            <button onClick={() => {
              const updated = shiftConnectedNodes(simplifyGraph(layoutedData), selectedComputerId, 500, 0);
              setLayoutedData(resolveEdgeNodes(updated));
            }}>→</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.3rem' }}>
            <button onClick={() => {
              const updated = shiftConnectedNodes(simplifyGraph(layoutedData), selectedComputerId, 0, 100);
              setLayoutedData(resolveEdgeNodes(updated));
            }}>↓</button>
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