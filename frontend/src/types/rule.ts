export type RuleType = 'validation' | 'calculation' | 'progression' | 'feedback';

export type ComplexitySeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ComplexityWarning {
  type: 'conditions' | 'nesting' | 'entities' | 'cyclic';
  severity: ComplexitySeverity;
  message: string;
  recommendation: string;
}

export interface ComplexityAnalysis {
  score: number;
  severity: ComplexitySeverity;
  warnings: ComplexityWarning[];
  metrics: {
    conditionCount: number;
    nestingDepth: number;
    entityCount: number;
    hasCyclicDependency: boolean;
  };
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  description: string;
  conditions: string;
  complexity?: ComplexityAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleFormData {
  name: string;
  type: RuleType;
  description: string;
  conditions: string;
}
