import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // GET /api/products - Fetch all products
      const { category, search } = req.query;

      const where: any = {};

      // Filter by category if provided
      if (category && category !== 'All') {
        where.category = category as string;
      }

      // Search by product name if provided
      if (search) {
        where.name = {
          contains: search as string,
          mode: 'insensitive',
        };
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        success: true,
        data: products,
      });
    } else if (req.method === 'POST') {
      // POST /api/products - Create a new product
      const { name, price, image, images, stock, category, subcategory, description } = req.body;

      // Validation
      if (!name || price == null || stock == null || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, stock, category',
        });
      }

      const numericPrice = parseFloat(price);
      const numericStock = parseInt(stock, 10);

      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a positive number',
        });
      }

      if (isNaN(numericStock) || numericStock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Stock must be a non-negative number',
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          price: numericPrice,
          image: image || '📦',
          images: Array.isArray(images) ? images : [],
          stock: numericStock,
          category,
          subcategory: subcategory || null,
          description: description || null,
        },
      });

      return res.status(201).json({
        success: true,
        data: product,
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}
