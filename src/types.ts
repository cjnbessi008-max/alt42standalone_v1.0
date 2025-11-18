export interface Point {
  x: number
  y: number
}

export interface ProblemData {
  id: number
  title: string
  description: string
  equation: string
  inflectionPoints: Point[]
}

export interface TiltConfig {
  angle: number
  duration: number
  delay: number
}
