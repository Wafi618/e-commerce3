import { NextApiRequest, NextApiResponse } from 'next';
import { productSchema } from '@/lib/schemas';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { ProductService } from '@/lib/services/productService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // GET /api/products - Fetch all products
      const { category, subcategory, search, minPrice, maxPrice } = req.query;

      // Check if user is admin
      const session = await getServerSession(req, res, getAuthOptions(req, res));
      const isAdmin = session?.user?.role === 'ADMIN';

      const products = await ProductService.getProducts({
        category: category as string,
        subcategory: subcategory as string,
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        isAdmin
      });

      return res.status(200).json({
        success: true,
        data: products,
      });
    } else if (req.method === 'POST') {
      // Check permission
      const session = await getServerSession(req, res, getAuthOptions(req, res));
      if (session?.user?.role !== 'ADMIN') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Zod Validation
      const result = productSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.issues.map(e => e.message).join(', '),
        });
      }

      const product = await ProductService.createProduct({
        ...result.data,
        price: Number(result.data.price),
        stock: Number(result.data.stock),
        image: result.data.image || '',
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
  } catch (error: any) {
    console.error('API Error:', error);

    // Handle Prisma Unique Constraint Violation
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({
        success: false,
        error: 'A product with this name already exists. Please use a unique name.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
