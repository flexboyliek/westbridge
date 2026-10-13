const initSqlJs = require('sql.js');
const fs = require('node:fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('./data/applications.db');
  const db = new SQL.Database(buffer);

  console.log('integrity:', db.exec('PRAGMA integrity_check')[0]?.values?.[0]?.[0]);
  console.log('count:', db.exec('SELECT COUNT(*) FROM applications')[0]?.values?.[0]?.[0]);
  console.log(
    'pending:',
    db.exec("SELECT id, discord_username FROM applications WHERE status='pending'"),
  );
})();
