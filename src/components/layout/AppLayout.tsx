import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleNewSaleClick = () => {
    navigate('/sales');
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onNewSaleClick={handleNewSaleClick} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-neutral-200)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
