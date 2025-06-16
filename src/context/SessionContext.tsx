import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { GraphData } from '../types';
import { useState } from 'react';


type SessionContextType = {
  graphData: GraphData;
  setGraphData: (data: GraphData) => void;
};

const defaultGraphData: GraphData = {
  nodes: [],
  edges: [],
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [graphData, setGraphData] = useState<GraphData>(defaultGraphData);

  return (
    <SessionContext.Provider value={{ graphData, setGraphData }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};