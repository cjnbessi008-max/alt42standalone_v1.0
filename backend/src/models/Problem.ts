export interface Condition {
  id: string;
  type: 'necessary' | 'sufficient';
  statement: string;
  isCorrect: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  premise: string;
  conclusion: string;
  necessaryCondition: Condition;
  sufficientCondition: Condition;
  explanation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Answer {
  problemId: string;
  conditionType: 'necessary' | 'sufficient';
  isCorrect: boolean;
  timestamp: Date;
}
