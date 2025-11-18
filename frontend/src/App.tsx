/**
 * KTM Math Planet - Main Application Component
 */

import React from 'react';
import { UniverseMap } from './components/universe/UniverseMap';
import { DiscoveryPlanet } from './components/planets/Planet1_Discovery/DiscoveryPlanet';
import { useJourneyStore } from './store/journeyStore';
import { PlanetNumber } from './types/planets';

function App() {
  const { currentPlanet, currentModule } = useJourneyStore();

  // For demo: show Discovery Planet by default
  // In production, this would be router-based
  const renderPlanet = () => {
    if (!currentModule) {
      return <UniverseMap />;
    }

    switch (currentPlanet) {
      case PlanetNumber.DISCOVERY:
        return <DiscoveryPlanet />;
      case PlanetNumber.LOGIC:
        return <div className="text-white p-8">Logic Planet - Coming Soon</div>;
      case PlanetNumber.DATA:
        return <div className="text-white p-8">Data Planet - Coming Soon</div>;
      case PlanetNumber.INTERFACE:
        return <div className="text-white p-8">Interface Planet - Coming Soon</div>;
      case PlanetNumber.CREATION:
        return <div className="text-white p-8">Creation Planet - Coming Soon</div>;
      case PlanetNumber.LAUNCH:
        return <div className="text-white p-8">Launch Planet - Coming Soon</div>;
      default:
        return <UniverseMap />;
    }
  };

  return (
    <div className="app">
      {renderPlanet()}
    </div>
  );
}

export default App;
