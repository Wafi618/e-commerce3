import { prisma } from '@/lib/prisma';
import { CreateProductInput, UpdateProductInput, ProductFilter } from '@/types/service';

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

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
      if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
    }

    // explicit archive filter takes precedence
    if (typeof filter.isArchived === 'boolean') {
      where.isArchived = filter.isArchived;
    } else if (!filter.isAdmin) {
      // Default: Filter out archived products for non-admins
      where.isArchived = false;
    }

    const total = await prisma.product.count({ where });

    let products = await prisma.product.findMany({
      where,
      skip: (filter.page && filter.limit) ? (filter.page - 1) * filter.limit : undefined,
      take: filter.limit,
      include: {
        options: {
          include: {
            values: true
          }
        }
      },
      orderBy: filter.latest ? [
        { createdAt: 'desc' } as any
      ] : (filter.isAdmin ? [
        { isArchived: 'asc' } as any, // Active first
        { sortOrder: 'asc' } as any,  // Then by sort order
        { createdAt: 'desc' } as any  // Newest fallback
      ] : [
        { sortOrder: 'asc' } as any,
        { createdAt: 'desc' } as any,
      ]),
    });

    // Map to include rotation fields explicity if needed
    products = products.map(p => ({
      ...p,
      // Ensure these exist in the output even if Prisma types lag
      imageRotation: (p as any).imageRotation || 0,
      options: p.options.map(o => ({
        ...o,
        values: o.values.map(v => ({
          ...v,
          rotation: (v as any).rotation || 0
        }))
      }))
    }));

    if (filter.search) {
      products = this.flattenProductsForSearch(products);
    }

    return { products, total };
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

  static async updateProduct(input: UpdateProductInput) {
    const { id, options, replaceOptions, ...data } = input;

    // First handle basic fields
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...data,
      }
    });

    // Handle Options if provided
    if (options) {
      if (input.replaceOptions) {
        // --- HYBRID RISK MODE: SYNC (Reconciliation) ---
        // 1. Get all existing options for this product
        const existingOptions = await prisma.productOption.findMany({
          where: { productId: id },
          include: { values: true }
        });

        // 2. Identify Options to Keep/Update vs Delete
        const optionsToKeepIds: string[] = [];

        for (const newOpt of options) {
          // Find if this new option matches an existing one by name
          let targetOption = existingOptions.find(eo => eo.name.toLowerCase() === newOpt.name.toLowerCase());

          if (targetOption) {
            optionsToKeepIds.push(targetOption.id);
            // Sync Values for this option
            const existingValues = targetOption.values;
            const valuesToKeepIds: string[] = [];

            for (const newVal of newOpt.values) {
              let targetVal = existingValues.find(ev => ev.name.toLowerCase() === newVal.name.toLowerCase());

              if (targetVal) {
                valuesToKeepIds.push(targetVal.id);
                // Update image if needed
                if (newVal.image && newVal.image !== targetVal.image) {
                  await prisma.productOptionValue.update({ where: { id: targetVal.id }, data: { image: newVal.image } });
                }
              } else {
                // Create new value
                const createdVal = await prisma.productOptionValue.create({
                  data: { optionId: targetOption.id, name: newVal.name, image: newVal.image }
                });
                valuesToKeepIds.push(createdVal.id);
              }
            }

            // Delete removed values for this option
            await prisma.productOptionValue.deleteMany({
              where: { optionId: targetOption.id, id: { notIn: valuesToKeepIds } }
            });

          } else {
            // Create entire new option
            const createdOpt = await prisma.productOption.create({
              data: {
                productId: id,
                name: newOpt.name,
                values: {
                  create: newOpt.values.map(v => ({ name: v.name, image: v.image }))
                }
              }
            });
            optionsToKeepIds.push(createdOpt.id);
          }
        }

        // 3. Delete removed Options
        await prisma.productOption.deleteMany({
          where: { productId: id, id: { notIn: optionsToKeepIds } }
        });

      } else {
        // --- DEFAULT SAFE MODE: MERGE ---
        for (const opt of options) {
          const existingOption = await prisma.productOption.findFirst({
            where: {
              productId: id,
              name: { equals: opt.name, mode: 'insensitive' }
            }
          });

          if (existingOption) {
            for (const val of opt.values) {
              const existingValue = await prisma.productOptionValue.findFirst({
                where: {
                  optionId: existingOption.id,
                  name: { equals: val.name, mode: 'insensitive' }
                }
              });

              if (existingValue) {
                if (val.image) {
                  await prisma.productOptionValue.update({
                    where: { id: existingValue.id },
                    data: { image: val.image }
                  });
                }
              } else {
                await prisma.productOptionValue.create({
                  data: {
                    optionId: existingOption.id,
                    name: val.name,
                    image: val.image
                  }
                });
              }
            }
          } else {
            await prisma.productOption.create({
              data: {
                productId: id,
                name: opt.name,
                values: {
                  create: opt.values.map(val => ({
                    name: val.name,
                    image: val.image
                  }))
                }
              }
            });
          }
        }
      }
    }

    return await prisma.product.findUnique({ where: { id } });
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
            imageRotation: val.image ? (val.rotation || 0) : (product.imageRotation || 0),
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
