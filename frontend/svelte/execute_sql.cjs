const { Client } = require('pg');
const fs = require('fs');

async function executeSQL() {
  const client = new Client({
    connectionString: 'postgresql://postgres:MLoyalty2024@localhost:5432/main_loyalty'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Execute storage cleanup
    console.log('\n🗑️  Executing storage cleanup...');
    const cleanupSQL = fs.readFileSync('remove_storage_completely.sql', 'utf8');
    const cleanupResult = await client.query(cleanupSQL);
    console.log('✅ Storage cleanup completed');

    // Execute static icon column addition
    console.log('\n📋 Adding static_icon column...');
    const addColumnSQL = fs.readFileSync('add_static_icon_column.sql', 'utf8');
    const addColumnResult = await client.query(addColumnSQL);
    console.log('✅ static_icon column added and populated');

    console.log('\n✨ All SQL scripts executed successfully!');
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    await client.end();
  }
}

executeSQL();
