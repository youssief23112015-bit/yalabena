import pg from 'pg';

const targets = [
  { label: 'localhost:5432 (native?)', host: '127.0.0.1', port: 5432, passwords: ['postgres', 'your_secure_password', 'password', 'admin', 'speakup'] },
  { label: 'docker-bridge 172.21.0.3:5432', host: '172.21.0.3', port: 5432, passwords: ['postgres'] },
];

for (const t of targets) {
  for (const pwd of t.passwords) {
    const client = new pg.Client({ host: t.host, port: t.port, user: 'postgres', password: pwd, database: 'postgres', connectionTimeoutMillis: 4000 });
    try {
      await client.connect();
      const dbs = await client.query('select datname from pg_database where not datistemplate order by 1');
      console.log(`OK ${t.label} password=${pwd} dbs=${dbs.rows.map((r) => r.datname).join(',')}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`FAIL ${t.label} password=${pwd}: ${e.message}`);
      try { await client.end(); } catch {}
    }
  }
}
process.exit(1);
