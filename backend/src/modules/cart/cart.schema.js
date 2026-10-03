const { z } = require('zod');

const addItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(1)
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1)
});

module.exports = {
  addItemSchema,
  updateItemSchema
};
