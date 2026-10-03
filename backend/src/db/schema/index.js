const { pgTable, serial, varchar, timestamp, integer, uuid, pgEnum, unique, index, text, jsonb, boolean } = require('drizzle-orm/pg-core');

const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED', 'FAILED']);
const reservationStatusEnum = pgEnum('reservation_status', ['AVAILABLE', 'RESERVED', 'CONFIRMED_SOLD', 'RELEASED']);

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('customer'),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  dob: timestamp('dob'),
  avatar_url: varchar('avatar_url', { length: 1024 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('shipping'),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  address_line_1: varchar('address_line_1', { length: 255 }).notNull(),
  address_line_2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  postal_code: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  is_default: integer('is_default').default(0), // 1 for default, 0 for not
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('address_user_idx').on(table.user_id)
}));

const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  base_price: integer('base_price').notNull(), // price in cents to prevent precision issues
  is_active: boolean('is_active').default(true).notNull(), // true for active, false for inactive
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

const product_categories = pgTable('product_categories', {
  product_id: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  category_id: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: unique('product_category_pk').on(table.product_id, table.category_id),
  productIdx: index('pc_product_idx').on(table.product_id),
  categoryIdx: index('pc_category_idx').on(table.category_id)
}));

const product_media = pgTable('product_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  url: varchar('url', { length: 1024 }).notNull(),
  public_id: varchar('public_id', { length: 255 }).notNull(),
  resource_type: varchar('resource_type', { length: 50 }).notNull().default('image'), // image, video
  poster_url: varchar('poster_url', { length: 1024 }), // for videos
  alt_text: varchar('alt_text', { length: 255 }),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productIdx: index('product_media_product_idx').on(table.product_id)
}));

const product_variants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  size: varchar('size', { length: 50 }),
  color: varchar('color', { length: 50 }),
  price_override: integer('price_override'), // if variant has a different price
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productIdx: index('variant_product_idx').on(table.product_id)
}));

const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'cascade' }).notNull().unique(),
  available_quantity: integer('available_quantity').notNull().default(0),
  reserved_quantity: integer('reserved_quantity').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  session_id: varchar('session_id', { length: 255 }), // for guest carts
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('cart_user_idx').on(table.user_id),
  sessionIdx: index('cart_session_idx').on(table.session_id)
}));

const cart_items = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cart_id: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cartIdx: index('cart_item_cart_idx').on(table.cart_id)
}));

const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  total_amount: integer('total_amount').notNull(), // in cents
  
  courier: text('courier'),
  tracking_number: text('tracking_number'),
  tracking_url: text('tracking_url'),
  shipped_at: timestamp('shipped_at'),
  estimated_delivery_date: timestamp('estimated_delivery_date'),
  delivery_notes: text('delivery_notes'),
  tracking_timeline: jsonb('tracking_timeline').default([]),

  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('order_user_idx').on(table.user_id),
  statusIdx: index('order_status_idx').on(table.status)
}));

const order_items = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  variant_id: uuid('variant_id').references(() => product_variants.id).notNull(),
  quantity: integer('quantity').notNull(),
  price_at_time: integer('price_at_time').notNull(), // historical price
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_item_order_idx').on(table.order_id)
}));

const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'stripe', 'razorpay'
  provider_transaction_id: varchar('provider_transaction_id', { length: 255 }),
  amount: integer('amount').notNull(), // in cents
  status: varchar('status', { length: 50 }).notNull(), 
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('payment_order_idx').on(table.order_id),
  transactionIdx: index('payment_tx_idx').on(table.provider_transaction_id)
}));

const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'cascade' }).notNull(),
  cart_id: uuid('cart_id').references(() => carts.id, { onDelete: 'set null' }),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  status: reservationStatusEnum('status').notNull().default('RESERVED'),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  variantIdx: index('reservation_variant_idx').on(table.variant_id),
  cartIdx: index('reservation_cart_idx').on(table.cart_id),
  orderIdx: index('reservation_order_idx').on(table.order_id)
}));

const processed_webhook_events = pgTable('processed_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  event_id: varchar('event_id', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueEvent: unique('unique_provider_event').on(table.provider, table.event_id)
}));

module.exports = {
  orderStatusEnum,
  reservationStatusEnum,
  users,
  addresses,
  categories,
  products,
  product_categories,
  product_media,
  product_variants,
  inventory,
  carts,
  cart_items,
  orders,
  order_items,
  payments,
  reservations,
  processed_webhook_events
};
