import { z } from 'zod';

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits'),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional(),
});

// --- Product Schemas ---

const productOptionValueSchema = z.object({
  name: z.string(),
  image: z.string().optional().nullable(),
});

const productOptionSchema = z.object({
  name: z.string(),
  values: z.array(productOptionValueSchema),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val)).refine((val) => val > 0, 'Price must be positive'),
  image: z.string().optional().nullable(), // Now optional to support option-based images
  images: z.array(z.string()).optional(),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val)).refine((val) => val >= 0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
  options: z.array(productOptionSchema).optional(),
}).refine(data => {
  // Custom validation: Either main image or at least one option value image must exist
  const hasMainImage = data.image && data.image.trim().length > 0;
  const hasOptionImage = data.options?.some(opt => opt.values.some(val => val.image && val.image.trim().length > 0));
  return hasMainImage || hasOptionImage;
}, {
  message: "Product must have either a main image or at least one option image",
  path: ["image"],
});

// --- Cart & Order Schemas ---

const cartItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => Number(val)),
  name: z.string(),
  price: z.union([z.string(), z.number()]).transform(val => Number(val)),
  quantity: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 1, 'Quantity must be at least 1'),
  selectedOptions: z.record(z.string(), z.string()).optional().nullable(),
});

export const checkoutSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  cartItems: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  userId: z.string().optional().nullable(),
  phone: z.string().min(1, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  house: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const manualCheckoutSchema = checkoutSchema.extend({
  bkashNumber: z.union([z.string(), z.number()]).transform(val => String(val)).refine(val => val.length > 0, 'bKash number is required'),
  trxId: z.union([z.string(), z.number()]).transform(val => String(val)).refine(val => val.length > 0, 'Transaction ID is required'),
});

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  phone: z.string().min(1, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().min(1, 'Address is required'),
  house: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});
