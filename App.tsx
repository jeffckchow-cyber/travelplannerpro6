
import React, { useState } from 'react';
import { TripProvider } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TripDetail } from './components/TripDetail';
import { Budget } from './components/Budget';
import { Toolbox } from './components/Toolbox';

type View = 'dashboard' | 'itinerary' | 'budget' | 'toolbox';

// Main application router
const Main: React.FC = () => {
  const [activeView, setActiveView] = useState<view>('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onnavigate="{setActiveView}"/>;
      case 'itinerary':
        return <TripDetail onback="{()" ==""> setActiveView('Dashboard')} />;
      case 'budget':
        return <Budget/>;
      case 'toolbox':
        return <Toolbox/>;
      default:
        return <dashboard onnavigate="{setActiveView}"/>;
    }
  };

  return (
    <layout activeview="{activeView}" setview="{setActiveView}">
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <tripprovider>
      <main/>
    </TripProvider>
  );
}
