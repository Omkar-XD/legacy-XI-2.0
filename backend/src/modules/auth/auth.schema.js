const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

module.exports = {
  registerSchema,
  loginSchema,
};
