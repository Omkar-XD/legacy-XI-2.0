const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category_ids: z.array(z.number().int().positive()).min(1, 'At least one category is required'),
  description: z.string().optional(),
  base_price: z.number().int().nonnegative(),
  is_active: z.boolean().optional().default(true),
});

const updateProductSchema = createProductSchema.partial();

const createVariantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  price_override: z.number().int().nonnegative().optional().nullable(),
  available_quantity: z.number().int().nonnegative().default(0),
});

const updateVariantSchema = createVariantSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema
};
