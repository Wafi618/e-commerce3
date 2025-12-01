import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/schemas';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Validate ID
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product ID',
    });
  }

  const productId = parseInt(id);

  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      error: 'Product ID must be a number',
    });
  }

  try {
    if (req.method === 'GET') {
      // GET /api/products/[id] - Fetch a single product with similar products
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          options: {
            include: {
              values: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Fetch similar products from the same category (excluding current product)
      const similarProducts = await prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: productId },
        },
        take: 8, // Limit to 8 similar products
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          product,
          similarProducts,
        },
      });
    } else if (req.method === 'PUT') {
      // Validate partial update
      const partialProductSchema = productSchema.partial();
      const result = partialProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.issues.map(e => e.message).join(', '),
        });
      }

      const { name, price, image, images, stock, category, subcategory, description, isArchived, options } = result.data;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Prepare update data (only include provided fields)
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = price;
      if (image !== undefined) updateData.image = image;
      if (images !== undefined) updateData.images = images;
      if (stock !== undefined) updateData.stock = stock;
      if (category !== undefined) updateData.category = category;
      if (subcategory !== undefined) updateData.subcategory = subcategory;
      if (description !== undefined) updateData.description = description;
      if (isArchived !== undefined) updateData.isArchived = isArchived;
      if (options !== undefined) {
        updateData.options = {
          deleteMany: {},
          create: options.map((opt: any) => ({
            name: opt.name,
            values: {
              create: opt.values.map((val: any) => ({
                name: val.name,
                image: val.image
              }))
            }
          }))
        };
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
            options: {
                include: {
                    values: true
                }
            }
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } else if (req.method === 'DELETE') {
      // DELETE /api/products/[id] - Delete a product
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Check if product is in any orders (optional business logic)
      const orderItemsCount = await prisma.orderItem.count({
        where: { productId },
      });

      if (orderItemsCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete product that is part of existing orders',
        });
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
