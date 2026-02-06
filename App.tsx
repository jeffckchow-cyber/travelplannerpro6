
import React, { useState } from 'react';
import { TripProvider } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TripDetail } from './components/TripDetail';
import { Budget } from './components/Budget';
import { Toolbox } from './components/Toolbox';

type View = 'dashboard' | 'itinerary' | 'budget' | 'toolbox';

const Main: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'itinerary':
        return <TripDetail onBack={() => setActiveView('dashboard')} />;
      case 'budget':
        return <Budget />;
      case 'toolbox':
        return <Toolbox />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} setView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <TripProvider>
      <Main />
    </TripProvider>
  );
}
