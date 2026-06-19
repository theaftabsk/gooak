const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:local_password_123@localhost:5433/oak_commerce'
});

async function main() {
  await client.connect();
  const shops = await client.query('SELECT id, name, slug, status FROM shops');
  console.log('Shops:');
  console.log(shops.rows);

  const domains = await client.query('SELECT * FROM shop_domains');
  console.log('Domains:');
  console.log(domains.rows);

  await client.end();
}

main().catch(console.error);
