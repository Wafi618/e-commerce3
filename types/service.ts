import { Prisma } from '@prisma/client';

export interface CreateOrderInput {
  customerName: string;
  email: string;
  userId?: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  house?: string | null;
  floor?: string | null;
  notes?: string | null;
  total: number;
  status?: string;
  paymentMethod: string;
  paymentPhoneNumber?: string | null;
  paymentTrxId?: string | null;
  items: {
    id?: string; // Product ID
    productId?: string; // Alternative Product ID field
    quantity: number;
    price: number;
    name?: string; // For notifications
    selectedOptions?: Prisma.InputJsonValue | null;
  }[];
}

export interface OrderFilter {
  status?: string;
  email?: string;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isAdmin?: boolean;
  latest?: boolean;
}

export interface CreateProductInput {
  name: string;
  price: number;
  image: string;
  images?: string[];
  stock: number;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  isArchived?: boolean;
  options?: {
    name: string;
    values: {
      name: string;
      image?: string;
    }[];
  }[];
}

export interface UpdateProductInput {
  id: number;
  name?: string;
  price?: number;
  image?: string;
  images?: string[];
  stock?: number;
  category?: string;
  subcategory?: string | null;
  description?: string | null;
  isArchived?: boolean;
  options?: {
    name: string;
    values: {
      name: string;
      image?: string;
    }[];
  }[];
  replaceOptions?: boolean;
}
