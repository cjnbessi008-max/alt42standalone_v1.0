import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ErrorCategory } from '../models';
import { asyncHandler } from '../middleware/errorHandler';

const categoryRepo = AppDataSource.getRepository(ErrorCategory);

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  }
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await categoryRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  }
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { nameKo, nameEn, description, icon, color, sortOrder } = req.body;

    const category = categoryRepo.create({
      nameKo,
      nameEn,
      description,
      icon,
      color,
      sortOrder,
    });

    await categoryRepo.save(category);

    res.status(201).json({
      success: true,
      data: category,
    });
  }
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nameKo, nameEn, description, icon, color, sortOrder, isActive } =
      req.body;

    const category = await categoryRepo.findOne({
      where: { id: parseInt(id) },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    if (nameKo !== undefined) category.nameKo = nameKo;
    if (nameEn !== undefined) category.nameEn = nameEn;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await categoryRepo.save(category);

    res.json({
      success: true,
      data: category,
    });
  }
);
