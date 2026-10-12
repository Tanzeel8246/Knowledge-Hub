import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection('mysql://u349923428_islamic:Abdulrahman*8246@api.mindcraftsai.com:3306/u349923428_islamic');
  try {
    const [rows, fields] = await conn.query('DESCRIBE users');
    console.log(rows);
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
}

main();
