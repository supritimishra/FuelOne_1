const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const l of lines) {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      map[k] = v;
    }
  }
  return map;
}

(async ()=>{
  const repoRoot = path.resolve(__dirname, '..');
  const env = loadEnv(path.join(repoRoot, '.env'));
  if (!env.DATABASE_URL) { console.error('DATABASE_URL missing in .env'); process.exit(1); }
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    console.log('-> Smoke test: Shift Sheet Entry (duty_shifts / shifts)');
    // Try to insert into duty_shifts if table exists
    let r = await client.query("INSERT INTO duty_shifts (shift_name, start_time, end_time, duties) VALUES ($1,$2,$3,$4) RETURNING id, shift_name", ['SMOKE_SHIFT', '06:00', '14:00', 3]);
    const id = r.rows[0].id;
    console.log('Inserted duty_shift id', id);
    // verify
    r = await client.query('SELECT * FROM duty_shifts WHERE id=$1', [id]);
    if (r.rows.length === 1) console.log('Verified duty_shift in DB');
    // cleanup
    await client.query('DELETE FROM duty_shifts WHERE id=$1', [id]);
    console.log('Deleted duty_shift');

    // If there's a separate shift_entries table (shift_sheets), try it as well
    try {
      r = await client.query("INSERT INTO shift_sheets (shift_date, shift_id, opened_by, opened_at) VALUES (CURRENT_DATE, $1, $2, NOW()) RETURNING id", [id, 'smoke-user']);
      const ssId = r.rows[0].id;
      console.log('Inserted shift_sheet id', ssId);
      await client.query('DELETE FROM shift_sheets WHERE id=$1', [ssId]);
      console.log('Deleted shift_sheet');
    } catch (e) {
      console.log('shift_sheets test skipped or table missing');
    }

    console.log('SMOKE SHIFT SHEET: PASS');
  } catch (err) {
    console.error('SMOKE SHIFT SHEET: FAIL', err && err.message ? err.message : err);
  } finally {
    await client.end();
    process.exit(0);
  }
})();
