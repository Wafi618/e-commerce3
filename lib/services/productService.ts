import { prisma } from '@/lib/prisma';
import { CreateProductInput, ProductFilter } from '@/types/service';

export class ProductService {

  static async getProducts(filter: ProductFilter) {
    const where: any = {};

    if (filter.category && filter.category !== 'All') {
      where.category = filter.category;
    }

    if (filter.subcategory && filter.subcategory !== 'All') {
      where.subcategory = filter.subcategory;
    }

    if (filter.search) {
      where.name = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    // Filter out archived products for non-admins
    if (!filter.isAdmin) {
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
      orderBy: filter.isAdmin ? [
        { isArchived: 'asc' } as const, 
        { createdAt: 'desc' } as const
      ] : {
        createdAt: 'desc',
      } as const,
    });

    if (filter.search) {
      return this.flattenProductsForSearch(products);
    }

    return products;
  }

  static async createProduct(input: CreateProductInput) {
    return await prisma.product.create({
      data: {
        name: input.name,
        price: input.price,
        image: input.image,
        images: input.images || [],
        stock: input.stock,
        category: input.category,
        subcategory: input.subcategory || null,
        description: input.description || null,
        isArchived: input.isArchived || false,
        options: {
          create: input.options?.map((opt) => ({
            name: opt.name,
            values: {
              create: opt.values.map((val) => ({
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
  }

  /**
   * Flattens product variants into individual search results
   */
  private static flattenProductsForSearch(products: any[]) {
    const flattenedProducts: any[] = [];

    for (const product of products) {
      const colorOption = product.options.find(
        (opt: any) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
      );

      if (colorOption && colorOption.values.length > 0) {
        for (const val of colorOption.values) {
          const variantImage = val.image || product.image || (product.images && product.images.length > 0 ? product.images[0] : '');

          flattenedProducts.push({
            ...product,
            id: `${product.id}-${val.id}`,
            name: product.name,
            variantName: val.name,
            image: variantImage,
          });
        }
      } else {
        const mainImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
        flattenedProducts.push({
          ...product,
          image: mainImage
        });
      }
    }
    return flattenedProducts;
  }
}
