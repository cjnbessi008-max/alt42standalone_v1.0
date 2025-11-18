import type { Point, Triangle, TriangleSides } from '../types'

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Calculate all side lengths of a triangle
 */
export function getTriangleSides(triangle: Triangle): TriangleSides {
  const [A, B, C] = triangle.vertices
  return {
    AB: distance(A, B),
    BC: distance(B, C),
    CA: distance(C, A)
  }
}

/**
 * Calculate the scale factor between two triangles
 */
export function calculateScaleFactor(source: Triangle, target: Triangle): number {
  const sourceSides = getTriangleSides(source)
  const targetSides = getTriangleSides(target)

  // Calculate ratio for each corresponding side
  const ratios = [
    targetSides.AB / sourceSides.AB,
    targetSides.BC / sourceSides.BC,
    targetSides.CA / sourceSides.CA
  ]

  // Return average (for similar triangles, all ratios should be equal)
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length
}

/**
 * Check if two triangles are similar (same shape, different size)
 */
export function areSimilar(t1: Triangle, t2: Triangle, tolerance: number = 0.05): boolean {
  const sides1 = getTriangleSides(t1)
  const sides2 = getTriangleSides(t2)

  // Normalize sides by dividing by the longest side
  const normalize = (sides: TriangleSides) => {
    const max = Math.max(sides.AB, sides.BC, sides.CA)
    return {
      AB: sides.AB / max,
      BC: sides.BC / max,
      CA: sides.CA / max
    }
  }

  const norm1 = normalize(sides1)
  const norm2 = normalize(sides2)

  // Check if normalized sides are approximately equal
  const diff = Math.abs(norm1.AB - norm2.AB) +
               Math.abs(norm1.BC - norm2.BC) +
               Math.abs(norm1.CA - norm2.CA)

  return diff < tolerance
}

/**
 * Calculate similarity score (0-1, where 1 is perfect similarity)
 */
export function calculateSimilarity(t1: Triangle, t2: Triangle): number {
  const sides1 = getTriangleSides(t1)
  const sides2 = getTriangleSides(t2)

  const normalize = (sides: TriangleSides) => {
    const max = Math.max(sides.AB, sides.BC, sides.CA)
    return {
      AB: sides.AB / max,
      BC: sides.BC / max,
      CA: sides.CA / max
    }
  }

  const norm1 = normalize(sides1)
  const norm2 = normalize(sides2)

  const maxDiff = Math.abs(norm1.AB - norm2.AB) +
                  Math.abs(norm1.BC - norm2.BC) +
                  Math.abs(norm1.CA - norm2.CA)

  // Convert difference to similarity (0 diff = 1 similarity)
  return Math.max(0, 1 - maxDiff)
}

/**
 * Calculate centroid (center point) of a triangle
 */
export function getCentroid(triangle: Triangle): Point {
  const [A, B, C] = triangle.vertices
  return {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3
  }
}

/**
 * Translate triangle by offset
 */
export function translateTriangle(triangle: Triangle, offset: Point): Triangle {
  return {
    ...triangle,
    vertices: triangle.vertices.map(v => ({
      x: v.x + offset.x,
      y: v.y + offset.y
    })) as [Point, Point, Point]
  }
}

/**
 * Scale triangle around its centroid
 */
export function scaleTriangle(triangle: Triangle, factor: number): Triangle {
  const centroid = getCentroid(triangle)
  return {
    ...triangle,
    vertices: triangle.vertices.map(v => ({
      x: centroid.x + (v.x - centroid.x) * factor,
      y: centroid.y + (v.y - centroid.y) * factor
    })) as [Point, Point, Point],
    scaleFactor: factor
  }
}

/**
 * Check if a point is inside a triangle (for hit detection)
 */
export function isPointInTriangle(point: Point, triangle: Triangle): boolean {
  const [A, B, C] = triangle.vertices

  const sign = (p1: Point, p2: Point, p3: Point): number => {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  }

  const d1 = sign(point, A, B)
  const d2 = sign(point, B, C)
  const d3 = sign(point, C, A)

  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0)
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0)

  return !(hasNeg && hasPos)
}

/**
 * Calculate overlap percentage between two triangles
 */
export function checkTrianglesOverlap(t1: Triangle, t2: Triangle): number {
  // Simplified overlap check based on centroid distance and size
  const c1 = getCentroid(t1)
  const c2 = getCentroid(t2)
  const dist = distance(c1, c2)

  const size1 = Math.max(...Object.values(getTriangleSides(t1)))
  const size2 = Math.max(...Object.values(getTriangleSides(t2)))
  const avgSize = (size1 + size2) / 2

  // If centroids are very close and sizes are similar, high overlap
  const distanceScore = Math.max(0, 1 - dist / avgSize)
  const sizeScore = 1 - Math.abs(size1 - size2) / avgSize

  return (distanceScore * 0.6 + sizeScore * 0.4)
}

/**
 * Calculate area of a triangle
 */
export function getTriangleArea(triangle: Triangle): number {
  const [A, B, C] = triangle.vertices
  return Math.abs(
    (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2
  )
}
