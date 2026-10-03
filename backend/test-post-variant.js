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

    // 2. Post a new variant
    let postRes = await fetch(`http://127.0.0.1:3001/api/admin/products/${product.id}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        sku: 'NEW-SKU-TEST-' + Date.now(),
        size: 'XL',
        available_quantity: 10
      })
    });
    console.log("POST variant status:", postRes.status);
    console.log("POST variant body:", await postRes.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
