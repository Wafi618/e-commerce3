import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/schemas';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';


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

      const { subcategory } = req.query;
      if (subcategory && subcategory !== 'All') {
        where.subcategory = subcategory as string;
      }

      // Search by product name if provided
      if (search) {
        where.name = {
          contains: search as string,
          mode: 'insensitive',
        };
      }

      // Check if user is admin
      const session = await getServerSession(req, res, getAuthOptions(req, res));
      const isAdmin = session?.user?.role === 'ADMIN';

      // Filter out archived products for non-admins
      // Filter out archived products for non-admins
      if (!isAdmin) {
        where.isArchived = false;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          options: {
            include: {
              values: true
            }
          }
        },
        orderBy: isAdmin ? [
          { isArchived: 'asc' } as const, // Active (false) first, Archived (true) last
          { createdAt: 'desc' } as const
        ] : {
          createdAt: 'desc',
        } as const,
      });

      return res.status(200).json({
        success: true,
        data: products,
      });
    } else if (req.method === 'POST') {
      // Zod Validation
      const result = productSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.issues.map(e => e.message).join(', '),
        });
      }

      const { name, price, image, images, stock, category, subcategory, description, options } = result.data;

      const product = await prisma.product.create({
        data: {
          name,
          price: price, // Zod transforms this to number
          image: image,
          images: images || [],
          stock: stock, // Zod transforms this to number
          category,
          subcategory: subcategory || null,
          description: description || null,
          isArchived: result.data.isArchived || false,
          options: {
            create: options?.map((opt: any) => ({
              name: opt.name,
              values: {
                create: opt.values.map((val: any) => ({
                  name: val.name,
                  image: val.image
                }))
              }
            }))
          }
        },
        include: {
          options: {
            include: {
              values: true
            }
          }
        }
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
