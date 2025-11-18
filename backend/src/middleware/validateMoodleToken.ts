import { Request, Response, NextFunction } from 'express'

export function validateMoodleToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-moodle-token'] as string

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Moodle token is required'
    })
    return
  }

  // In production, validate token with Moodle
  // For now, just check if it exists
  next()
}
