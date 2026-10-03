async function run() {
  try {
    const loginRes = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@legacyxi.com', password: 'admin123' })
    });
    const cookies = loginRes.headers.get('set-cookie');
    
    let res = await fetch('http://127.0.0.1:3001/api/admin/products', {
      headers: { 'Cookie': cookies }
    });
    let data = await res.json();
    let product = data.products[0];
    let variant = product.variants[0];
    console.log("Variant to patch:", variant.id);

    let patchRes = await fetch(`http://127.0.0.1:3001/api/admin/variants/${variant.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        sku: variant.sku,
        size: variant.size,
        available_quantity: variant.available_quantity,
        price_override: variant.price_override
      })
    });
    console.log("PATCH variant status:", patchRes.status);
    console.log("PATCH variant body:", await patchRes.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
