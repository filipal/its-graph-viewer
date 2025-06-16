import React from 'react';

type ToolbarProps = {
  onLoadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onReset: () => void;
  viewMode: 'landscape' | 'credentials' | 'dataservice' | 'firewalls';
  setViewMode: (mode: 'landscape' | 'credentials' | 'dataservice' | 'firewalls') => void;
};

const Toolbar: React.FC<ToolbarProps> = ({
  onLoadFile,
  onExport,
  onReset,
  viewMode,
  setViewMode
}) => {
  return (
    <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
      <input type="file" accept="application/json" onChange={onLoadFile} />
      
      <label>
        Odaberi prikaz:
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as any)}
          style={{ marginLeft: '10px' }}
        >
          <option value="landscape">Sve (Landscape)</option>
          <option value="credentials">Pristupi (Credentials)</option>
          <option value="dataservice">Podatkovne usluge (DataService)</option>
          <option value="firewalls">Vatrozidi (Firewalls)</option>
        </select>
      </label>

      <button onClick={onExport}>Export JSON</button>
      <button onClick={onReset}>Reset</button>
    </div>
  );
};

export default Toolbar;
