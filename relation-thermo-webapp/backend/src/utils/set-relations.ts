import { RelationType } from '@prisma/client';

export function determineRelation(setA: number[], setB: number[]): RelationType {
  const setAUnique = new Set(setA);
  const setBUnique = new Set(setB);

  const intersection = new Set([...setAUnique].filter((x) => setBUnique.has(x)));

  // Equal: A = B
  if (
    setAUnique.size === setBUnique.size &&
    intersection.size === setAUnique.size
  ) {
    return 'EQUAL';
  }

  // Subset: A ⊆ B (and A ≠ B)
  if (
    intersection.size === setAUnique.size &&
    setAUnique.size < setBUnique.size
  ) {
    return 'SUBSET';
  }

  // Superset: A ⊇ B (and A ≠ B)
  if (
    intersection.size === setBUnique.size &&
    setBUnique.size < setAUnique.size
  ) {
    return 'SUPERSET';
  }

  // Disjoint: A ∩ B = ∅
  if (intersection.size === 0) {
    return 'DISJOINT';
  }

  // Intersect: A ∩ B ≠ ∅ (but not subset/superset/equal)
  return 'INTERSECT';
}

export function getRelationLabel(relation: RelationType): string {
  const labels: Record<RelationType, string> = {
    SUBSET: '부분집합 (A ⊆ B)',
    SUPERSET: '초집합 (A ⊇ B)',
    EQUAL: '같음 (A = B)',
    DISJOINT: '서로소 (A ∩ B = ∅)',
    INTERSECT: '교집합 존재 (A ∩ B ≠ ∅)',
  };

  return labels[relation];
}
