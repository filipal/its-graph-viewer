Arhitektura grafa: SessionContext, useGraph, GraphCanvasComponent

🔁SessionContext (context/SessionContext.tsx)
Centralno mjesto u kojem se čuvaju svi podaci o grafu — čvorovi (nodes) i veze (edges).

Omogućuje da više komponenti dijeli i sinkronizira prikaz grafa.

Potrebno je wrapati aplikaciju u <SessionProvider> kako bi sve unutar aplikacije imalo pristup.

<SessionProvider>
  <App />
</SessionProvider>

useGraph (hooks/useGraph.ts)
Custom React hook koji olakšava dodavanje i ažuriranje čvorova i veza u grafu.
* Koristi podatke iz SessionContexta:
* addNode(node) – dodaje novi čvor
* addEdge(edge) – dodaje novu vezu
* updateNode(updatedNode) – ažurira postojeći čvor prema id
* updateEdge(updatedEdge) – ažurira postojeću vezu prema id

GraphCanvasComponent (components/GraphCanvasComponent.tsx)
Vizualna komponenta koja prikazuje graf pomoću biblioteke Reagraph. Sadrži:
* filtriranje čvorova po grupama i tipovima (users, servers, itd.)
* logiku za prikaz virtualnih veza (npr. user → software ako nema računala)
* layout preko Force Atlas algoritma
* ručno pomicanje povezanih čvorova
* prikaz avatara i tooltipova za svaki čvor
* prikaz kontrole za smjerno pomicanje (↑ ← → ↓)

useLocalStorage (hooks/useLocalStorage.ts)
Helper hook koji omogućuje da se bilo koja vrijednost automatski sprema u i čita iz localStorage. Koristan ako želiš:
* spremiti preferencije korisnika (npr. zadnje odabranu grupu)
* lokalno zapamtiti promjene grafa koje ne ovise o backendu

Pregled toka podataka:
GraphCanvasComponent
     ↕ uses
SessionContext ←→ useGraph
     ↕
localStorage (opcionalno)

Primjeri korištenja:
const { addNode, addEdge } = useGraph();

addNode({
  id: 'user-123',
  label: 'Novi korisnik',
  type: 'user',
});

