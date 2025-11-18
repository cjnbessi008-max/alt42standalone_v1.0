export interface Point {
    x: number;
    y: number;
}

export interface GeometricShape {
    id?: number;
    name: string;
    shape_type: 'triangle' | 'quadrilateral' | 'polygon';
    vertices: Point[];
    created_at?: string;
}

export interface SimilarityProblem {
    id?: number;
    title: string;
    description?: string;
    shape_a_id: number;
    shape_b_id: number;
    is_similar?: boolean;
    similarity_ratio?: number;
    similarity_type?: string;
    created_at?: string;
}

export interface StudentSolution {
    id?: number;
    problem_id: number;
    student_name?: string;
    answer_is_similar: boolean;
    answer_ratio?: number;
    is_correct?: boolean;
    submitted_at?: string;
}

export interface SimilarityAnalysis {
    is_similar: boolean;
    similarity_ratio?: number;
    similarity_type?: 'SSS' | 'SAS' | 'AA' | 'AAA' | 'none';
    side_ratios?: number[];
    angle_differences?: number[];
    confidence: number;
}
