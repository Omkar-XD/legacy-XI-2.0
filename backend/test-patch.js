async function run() {
  try {
    const loginRes = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@legacyxi.com', password: 'admin123' })
    });
    const cookies = loginRes.headers.get('set-cookie');
    console.log("Login cookies:", cookies);
    
    let res = await fetch('http://127.0.0.1:3001/api/admin/products', {
      headers: { 'Cookie': cookies }
    });
    let data = await res.json();
    let product = data.products[0];
    console.log("Product to patch:", product.id);

    // 2. Patch the product
    let patchRes = await fetch(`http://127.0.0.1:3001/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        is_active: true
      })
    });
    console.log("PATCH status:", patchRes.status);
    console.log("PATCH body:", await patchRes.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
