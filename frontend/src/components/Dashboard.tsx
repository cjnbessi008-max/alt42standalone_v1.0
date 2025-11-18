import React, { useState } from 'react';
import './Dashboard.css';
import FrequencyBiasAnalysis from './FrequencyBiasAnalysis';
import DemographicBiasAnalysis from './DemographicBiasAnalysis';
import TemporalBiasAnalysis from './TemporalBiasAnalysis';
import EffectivenessBiasAnalysis from './EffectivenessBiasAnalysis';
import DataImport from './DataImport';

type TabType = 'frequency' | 'demographic' | 'temporal' | 'effectiveness' | 'import';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('frequency');

  const renderContent = () => {
    switch (activeTab) {
      case 'frequency':
        return <FrequencyBiasAnalysis />;
      case 'demographic':
        return <DemographicBiasAnalysis />;
      case 'temporal':
        return <TemporalBiasAnalysis />;
      case 'effectiveness':
        return <EffectivenessBiasAnalysis />;
      case 'import':
        return <DataImport />;
      default:
        return <FrequencyBiasAnalysis />;
    }
  };

  return (
    <div className="dashboard">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'frequency' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequency')}
        >
          📊 Usage Frequency
        </button>
        <button
          className={`tab ${activeTab === 'demographic' ? 'active' : ''}`}
          onClick={() => setActiveTab('demographic')}
        >
          👥 Demographics
        </button>
        <button
          className={`tab ${activeTab === 'temporal' ? 'active' : ''}`}
          onClick={() => setActiveTab('temporal')}
        >
          ⏰ Temporal Patterns
        </button>
        <button
          className={`tab ${activeTab === 'effectiveness' ? 'active' : ''}`}
          onClick={() => setActiveTab('effectiveness')}
        >
          ✅ Effectiveness
        </button>
        <button
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 Import Data
        </button>
      </div>

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
