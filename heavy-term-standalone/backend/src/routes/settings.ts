/**
 * Settings API Routes
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../server.js'

const router = Router()

// GET /api/settings - Get all settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany()

    // Convert settings to key-value object
    const settingsObject: Record<string, any> = {}

    for (const setting of settings) {
      let value: any = setting.value

      // Parse value based on type
      switch (setting.type) {
        case 'number':
          value = parseFloat(setting.value)
          break
        case 'boolean':
          value = setting.value === 'true'
          break
        case 'json':
          value = JSON.parse(setting.value)
          break
      }

      settingsObject[setting.key] = value
    }

    res.json({
      success: true,
      data: settingsObject,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    })
  }
})

// PUT /api/settings/:key - Update setting
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const { value } = req.body

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Value is required',
      })
    }

    const setting = await prisma.setting.update({
      where: { key },
      data: {
        value: String(value),
      },
    })

    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update setting',
    })
  }
})

export default router
