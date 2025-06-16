import type { GraphData, NodeType, EdgeType } from '../types';

const serviceIcons = new Set([
  "rdp", "internetbanking", "finapp", "ad", "ldap",
  "dataserver", "emailserver", "emailwebserver"
]);

const userRoles = new Set([
  "ceo:ceo", "admin", "ceo:financial", "finance:banking", "developer:windows:senior"
]);

const customerKeywords = ["emailclient", "browser", "finance", "office", "admin"];
const binaryKeywords = ["sql server", "exchange server", "windows server", "internet information services", "active directory"];
const devKeywords = ["visual studio", "dev:windows"];
const internetKeywords = ["internet connection"];

function normalizeLabel(text: string): string {
  return text
    .replace(/^cpe:\/[aoh]:/, '') // Remove cpe:/a:
    .replace(/_/g, ' ')
    .replace(/[-#]/g, ' ')
    .replace(/:+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSoftwareIcon(sw: any): string {
  const name = (sw?.name || sw?.cpe_idn || "").toLowerCase();

  if (binaryKeywords.some(k => name.includes(k))) {
    return "/icons/binary.png";
  }

  if (customerKeywords.some(k => name.includes(k))) {
    return "/icons/customer.png";
  }

  if (devKeywords.some(k => name.includes(k))) {
    return "/icons/user.png";
  }

  if (internetKeywords.some(k => name.includes(k))) {
    return "/icons/internet.png";
  }

  return "/icons/binary.png"; // fallback
}

function getPersonIcon(personId: string): string {
  return userRoles.has(personId.toLowerCase()) ? "/icons/user.png" : "/icons/customer.png";
}

export function parseJSONToGraph(
  json: any,
  viewMode: 'landscape' | 'credentials' | 'dataservice' | 'firewalls'
): GraphData {
  const nodes: NodeType[] = [];
  const edges: EdgeType[] = [];
  const nodeIndex: Record<string, NodeType> = {};
  const edgeSet = new Set<string>();

  if (viewMode !== 'landscape') return { nodes: [], edges: [] };

  const zeroIndexSoftware = new Set<string>();
  for (const comp of Object.values(json.computers) as any[]) {
    if (comp.installed_software) {
      for (const [swId, sw] of Object.entries(comp.installed_software) as [string, any][]) {
        if (sw.person_index === 0) {
          zeroIndexSoftware.add(swId);
        }
      }
    }
  }

  for (const [compId, comp] of Object.entries(json.computers) as [string, any][]) {
    const group = comp.network_idn || 'default';

    const validSoftwareIds = Object.entries(comp.installed_software || {})
      .filter(([swId]) => zeroIndexSoftware.has(swId))
      .map(([swId]) => swId);

    const hasPerson = !!comp.person_group_id;
    if (!validSoftwareIds.length && !hasPerson) continue;

    // Računalo
    if (!nodeIndex[compId]) {
      nodeIndex[compId] = {
        id: compId,
        label: compId.replace(/:/g, '.'),
        type: 'computer',
        icon: '/icons/computer.png',
        group
      };
      nodes.push(nodeIndex[compId]);
    }

    // Osoba
    if (hasPerson && !nodeIndex[comp.person_group_id]) {
      nodeIndex[comp.person_group_id] = {
        id: comp.person_group_id,
        label: comp.person_group_id,
        type: 'person',
        icon: getPersonIcon(comp.person_group_id),
        group
      };
      nodes.push(nodeIndex[comp.person_group_id]);
    }

    if (hasPerson) {
      const edgeId = `edge-${comp.person_group_id}-${compId}`;
      if (!edgeSet.has(edgeId)) {
        edges.push({ id: edgeId, source: comp.person_group_id, target: compId, type: 'user-computer' });
        edgeSet.add(edgeId);
      }
    }

    for (const swId of validSoftwareIds) {
      const sw = comp.installed_software[swId];
      const swLabel = normalizeLabel(sw.cpe_idn || sw.name || swId);

      // Binarni softver
      if (!nodeIndex[swId]) {
        nodeIndex[swId] = {
          id: swId,
          label: swLabel,
          type: 'software',
          icon: getSoftwareIcon(sw),
          group
        };
        nodes.push(nodeIndex[swId]);
      }

      const edgeId = `edge-${compId}-${swId}`;
      if (!edgeSet.has(edgeId)) {
        edges.push({ id: edgeId, source: compId, target: swId, type: 'computer-software' });
        edgeSet.add(edgeId);
      }

      // Ako je customer-type softver, dodaj dodatni čvor
      for (const keyword of customerKeywords) {
        if ((sw.name || "").toLowerCase().includes(keyword)) {
          const customerId = `${keyword}-${swId}`;
          if (!nodeIndex[customerId]) {
            nodeIndex[customerId] = {
              id: customerId,
              label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
              type: 'user-service',
              icon: '/icons/customer.png',
              group
            };
            nodes.push(nodeIndex[customerId]);
          }

          const edgeCustomerId = `edge-${swId}-${customerId}`;
          if (!edgeSet.has(edgeCustomerId)) {
            edges.push({ id: edgeCustomerId, source: swId, target: customerId, type: 'software-user-service' });
            edgeSet.add(edgeCustomerId);
          }
        }
      }

      // Network servisi
      if (sw.provides_network_services) {
        sw.provides_network_services.forEach((service: string, idx: number) => {
          const sid = `${service}-${swId}`;
          if (!nodeIndex[sid]) {
            nodeIndex[sid] = {
              id: sid,
              label: service,
              type: 'service',
              icon: serviceIcons.has(service.toLowerCase()) ? '/icons/service.png' : '/icons/user.png',
              group
            };
            nodes.push(nodeIndex[sid]);
          }
          const edgeId = `edge-${swId}-${sid}-${idx}`;
          if (!edgeSet.has(edgeId)) {
            edges.push({ id: edgeId, source: swId, target: sid, type: 'software-service' });
            edgeSet.add(edgeId);
          }
        });
      }

      // User servisi
      if (sw.provides_user_services) {
        sw.provides_user_services.forEach((service: string, idx: number) => {
          const sid = `${service}-${swId}`;
          if (!nodeIndex[sid]) {
            nodeIndex[sid] = {
              id: sid,
              label: service,
              type: 'user-service',
              icon: '/icons/user.png',
              group
            };
            nodes.push(nodeIndex[sid]);
          }
          const edgeId = `edge-${swId}-${sid}-${idx}`;
          if (!edgeSet.has(edgeId)) {
            edges.push({ id: edgeId, source: swId, target: sid, type: 'software-user-service' });
            edgeSet.add(edgeId);
          }
        });
      }
    }
  }

  // Ukloni čvorove koji nisu u nijednoj vezi
  const connectedNodeIds = new Set(edges.flatMap(e => [e.source, e.target]));
  const filteredNodes = nodes.filter(n => connectedNodeIds.has(n.id));

  return { nodes: filteredNodes, edges };
}
