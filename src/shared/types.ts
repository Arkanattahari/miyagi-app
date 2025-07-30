import z from "zod";

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(['owner', 'cashier', 'chef']),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Category Schema
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

// Raw Material Schema
export const RawMaterialSchema = z.object({
  id: z.number(),
  name: z.string(),
  base_unit: z.string(),
  purchase_unit: z.string(),
  conversion_factor: z.number(),
  current_stock: z.number(),
  current_cost_per_base_unit: z.number(),
  minimum_stock: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RawMaterial = z.infer<typeof RawMaterialSchema>;

// Product Schema
export const ProductSchema = z.object({
  id: z.number(),
  category_id: z.number().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  base_price: z.number(),
  calculated_cogs: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  category_name: z.string().nullable().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// Product Variant Schema
export const ProductVariantSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  name: z.string(),
  price: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// Order Schema
export const OrderSchema = z.object({
  id: z.number(),
  order_number: z.string(),
  order_type: z.enum(['dine_in', 'takeaway']),
  table_number: z.number().nullable(),
  status: z.enum(['open', 'closed', 'cancelled']),
  total_amount: z.number(),
  tax_amount: z.number(),
  discount_amount: z.number(),
  final_amount: z.number(),
  cashier_user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

// Order Item Schema
export const OrderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  product_variant_id: z.number().nullable(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number(),
  kitchen_status: z.enum(['pending', 'in_progress', 'completed']),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  product_name: z.string().optional(),
  variant_name: z.string().nullable().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// Dashboard Data Schema
export const DashboardDataSchema = z.object({
  todaySales: z.object({
    total_orders: z.number(),
    total_sales: z.number(),
    total_profit: z.number(),
  }),
  lowStockMaterials: z.array(z.object({
    name: z.string(),
    current_stock: z.number(),
    minimum_stock: z.number(),
    base_unit: z.string(),
  })),
  topProducts: z.array(z.object({
    name: z.string(),
    total_sold: z.number(),
  })),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;
