import { PhoneFrame } from './components/PhoneFrame';
import { DistributionMorph } from './components/DistributionMorph';
import { ControlPanel } from './components/ControlPanel';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Main control panel */}
      <div className="container mx-auto py-8">
        <ControlPanel />
      </div>

      {/* Phone frame with distribution visualization (fixed bottom-right) */}
      <PhoneFrame>
        <DistributionMorph />
      </PhoneFrame>

      {/* Footer */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-500">
        <p>Distribution Morph v1.0</p>
        <p className="text-xs">Moodle 3.7 | PHP 7.1.9 | MySQL 5.7</p>
      </div>
    </div>
  );
}

export default App;
