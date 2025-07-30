import { Hono } from "hono";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono<{ Bindings: Env }>();

// CORS middleware for development
app.use('*', async (c, next) => {
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// OAuth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", zValidator('json', z.object({
  code: z.string()
})), async (c) => {
  const { code } = c.req.valid('json');

  const sessionToken = await exchangeCodeForSessionToken(code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user profile exists in our database
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user?.id).first();

  if (!profile) {
    // Create new user profile with default cashier role
    await c.env.DB.prepare(
      "INSERT INTO user_profiles (user_id, email, name, role) VALUES (?, ?, ?, ?)"
    ).bind(user?.id, user?.email, user?.google_user_data?.name || user?.email, 'cashier').run();
    
    const newProfile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user?.id).first();
    
    return c.json({ ...user, profile: newProfile });
  }

  return c.json({ ...user, profile });
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Dashboard API - Owner only
app.get('/api/dashboard', authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ?"
  ).bind(user?.id).first();

  if (profile?.role !== 'owner') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Get today's sales
  const todaySales = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(final_amount), 0) as total_sales,
      COALESCE(SUM(final_amount - (SELECT SUM(oi.quantity * p.calculated_cogs) 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = orders.id)), 0) as total_profit
    FROM orders 
    WHERE DATE(created_at) = DATE('now') AND status = 'closed'
  `).first();

  // Get low stock materials
  const lowStockMaterials = await c.env.DB.prepare(`
    SELECT name, current_stock, minimum_stock, base_unit
    FROM raw_materials 
    WHERE current_stock <= minimum_stock AND is_active = 1
    ORDER BY (current_stock / minimum_stock) ASC
    LIMIT 5
  `).all();

  // Get top selling products
  const topProducts = await c.env.DB.prepare(`
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE DATE(o.created_at) = DATE('now') AND o.status = 'closed'
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  return c.json({
    todaySales: todaySales,
    lowStockMaterials: lowStockMaterials.results,
    topProducts: topProducts.results
  });
});

// Categories API
app.get('/api/categories', authMiddleware, async (c) => {
  const categories = await c.env.DB.prepare(
    "SELECT * FROM categories WHERE is_active = 1 ORDER BY name"
  ).all();
  
  return c.json(categories.results);
});

// Products API
app.get('/api/products', authMiddleware, async (c) => {
  const products = await c.env.DB.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY c.name, p.name
  `).all();
  
  return c.json(products.results);
});

// Product variants API
app.get('/api/products/:productId/variants', authMiddleware, async (c) => {
  const productId = c.req.param('productId');
  const variants = await c.env.DB.prepare(
    "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY price"
  ).bind(productId).all();
  
  return c.json(variants.results);
});

// Orders API
app.post('/api/orders', authMiddleware, zValidator('json', z.object({
  order_type: z.enum(['dine_in', 'takeaway']),
  table_number: z.number().optional(),
  items: z.array(z.object({
    product_id: z.number(),
    product_variant_id: z.number().optional(),
    quantity: z.number(),
    unit_price: z.number(),
    notes: z.string().optional()
  }))
})), async (c) => {
  const user = c.get("user");
  const { order_type, table_number, items } = c.req.valid('json');
  
  // Generate order number
  const orderNumber = `ORD-${Date.now()}`;
  
  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  
  // Create order
  const orderResult = await c.env.DB.prepare(`
    INSERT INTO orders (order_number, order_type, table_number, total_amount, final_amount, cashier_user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(orderNumber, order_type, table_number, totalAmount, totalAmount, user?.id).run();
  
  const orderId = orderResult.meta.last_row_id;
  
  // Add order items
  for (const item of items) {
    await c.env.DB.prepare(`
      INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, unit_price, total_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      item.product_id, 
      item.product_variant_id,
      item.quantity,
      item.unit_price,
      item.unit_price * item.quantity,
      item.notes
    ).run();
  }
  
  return c.json({ success: true, orderId, orderNumber });
});

// Get open orders for kitchen
app.get('/api/kitchen/orders', authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ?"
  ).bind(user?.id).first();

  if (profile?.role !== 'chef' && profile?.role !== 'owner') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const orders = await c.env.DB.prepare(`
    SELECT 
      o.id, o.order_number, o.order_type, o.table_number, o.created_at,
      oi.id as item_id, oi.quantity, oi.kitchen_status, oi.notes,
      p.name as product_name,
      pv.name as variant_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
    WHERE o.status = 'open' AND oi.kitchen_status != 'completed'
    ORDER BY o.created_at ASC
  `).all();
  
  return c.json(orders.results);
});

// Update kitchen status
app.put('/api/kitchen/orders/:itemId/status', authMiddleware, zValidator('json', z.object({
  status: z.enum(['pending', 'in_progress', 'completed'])
})), async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ?"
  ).bind(user?.id).first();

  if (profile?.role !== 'chef' && profile?.role !== 'owner') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const itemId = c.req.param('itemId');
  const { status } = c.req.valid('json');
  
  await c.env.DB.prepare(
    "UPDATE order_items SET kitchen_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(status, itemId).run();
  
  return c.json({ success: true });
});

export default app;
