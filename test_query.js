const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection('mysql://u349923428_islamic:Abdulrahman*8246@api.mindcraftsai.com:3306/u349923428_islamic');
  try {
    await conn.query('select `id`, `name`, `email`, `password_hash`, `role`, `language`, `theme`, `avatar_url`, `last_active_at`, `created_at`, `updated_at` from `users` where `users`.`email` = ? limit ?', ['test@example.com', 1]);
    console.log('success');
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
