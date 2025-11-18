import { GraphData } from '../types/graph';

/**
 * Sample graph data representing a fraction learning module concept map
 * Based on the PRD example (Appendix B)
 */
export const sampleGraphData: GraphData = {
  nodes: [
    // Core concept
    {
      id: '1',
      label: 'Fraction\n(분수)',
      title: 'Core concept: Fraction',
      level: 1,
      color: '#667eea',
    },
    // Components
    {
      id: '2',
      label: 'Numerator\n(분자)',
      title: 'The top number of a fraction',
      level: 2,
      color: '#48bb78',
    },
    {
      id: '3',
      label: 'Denominator\n(분모)',
      title: 'The bottom number of a fraction',
      level: 2,
      color: '#48bb78',
    },
    // Visual representations
    {
      id: '4',
      label: 'Pizza\n(피자)',
      title: 'Visual representation using pizza',
      level: 3,
      color: '#ed8936',
    },
    {
      id: '5',
      label: 'Cake\n(케이크)',
      title: 'Visual representation using cake',
      level: 3,
      color: '#ed8936',
    },
    {
      id: '6',
      label: 'Bar Model\n(막대 모형)',
      title: 'Abstract bar representation',
      level: 3,
      color: '#ed8936',
    },
    // Operations
    {
      id: '7',
      label: 'Addition\n(덧셈)',
      title: 'Adding fractions',
      level: 2,
      color: '#9f7aea',
    },
    {
      id: '8',
      label: 'Subtraction\n(뺄셈)',
      title: 'Subtracting fractions',
      level: 2,
      color: '#9f7aea',
    },
    // Concepts
    {
      id: '9',
      label: 'Simplify\n(약분)',
      title: 'Reducing fractions to simplest form',
      level: 3,
      color: '#38b2ac',
    },
    {
      id: '10',
      label: 'Common\nDenominator\n(통분)',
      title: 'Finding common denominators',
      level: 3,
      color: '#38b2ac',
    },
  ],
  edges: [
    // Fraction has components
    {
      id: 'e1',
      from: '1',
      to: '2',
      label: 'has-a',
      arrows: 'to',
    },
    {
      id: 'e2',
      from: '1',
      to: '3',
      label: 'has-a',
      arrows: 'to',
    },
    // Fraction can be visualized as
    {
      id: 'e3',
      from: '1',
      to: '4',
      label: 'visualized-as',
      arrows: 'to',
    },
    {
      id: 'e4',
      from: '1',
      to: '5',
      label: 'visualized-as',
      arrows: 'to',
    },
    {
      id: 'e5',
      from: '1',
      to: '6',
      label: 'visualized-as',
      arrows: 'to',
    },
    // Operations on fractions
    {
      id: 'e6',
      from: '1',
      to: '7',
      label: 'supports',
      arrows: 'to',
    },
    {
      id: 'e7',
      from: '1',
      to: '8',
      label: 'supports',
      arrows: 'to',
    },
    // Operations require concepts
    {
      id: 'e8',
      from: '7',
      to: '10',
      label: 'requires',
      arrows: 'to',
    },
    {
      id: 'e9',
      from: '8',
      to: '10',
      label: 'requires',
      arrows: 'to',
    },
    {
      id: 'e10',
      from: '7',
      to: '9',
      label: 'may-use',
      arrows: 'to',
    },
    {
      id: 'e11',
      from: '8',
      to: '9',
      label: 'may-use',
      arrows: 'to',
    },
  ],
};
