const bcrypt = require('bcryptjs');
const { db } = require('../db/index');
const { users } = require('../db/schema/index');
const { eq } = require('drizzle-orm');

async function initAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@legacyxi.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (!adminEmail || !adminPassword) {
    return;
  }
  
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    if (existingAdmin.length > 0) {
      // Update password and ensure role is admin
      await db.update(users)
        .set({ password_hash: passwordHash, role: 'admin' })
        .where(eq(users.email, adminEmail));
      console.log(`Admin user ${adminEmail} updated from env variables.`);
    } else {
      // Create new admin user
      await db.insert(users).values({
        email: adminEmail,
        password_hash: passwordHash,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
      });
      console.log(`Admin user ${adminEmail} created from env variables.`);
    }
  } catch (err) {
    console.error('Error initializing admin user:', err);
  }
}

module.exports = { initAdmin };
