const { z } = require('zod');

const productQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  category_id: z.coerce.number().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

const searchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

module.exports = {
  productQuerySchema,
  searchSchema
};
