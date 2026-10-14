import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

// Run server-side only. Never use a NEXT_PUBLIC_ service-role key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.LECTURER_SEED_EMAIL?.trim().toLowerCase();
const name = process.env.LECTURER_SEED_NAME || 'DarasaX Lecturer';
if (!url || !key || !email) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and LECTURER_SEED_EMAIL.');
  process.exit(1);
}
const password = process.env.LECTURER_SEED_PASSWORD || `${randomBytes(24).toString('base64url')}!Aa9`;
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.auth.admin.createUser({
  email, password, email_confirm: true,
  user_metadata: { full_name: name, role: 'lecturer' },
});
if (error) {
  console.error('Account creation failed:', error.code || 'unknown error');
  process.exit(1);
}
const { error: profileError } = await client.from('staff_profiles').upsert({
  id: data.user.id, email, full_name: name, role: 'lecturer', status: 'active',
  stream_id: null, stream_ids: ['BENG24COE-1'], module_ids: ['mod-web'],
  onboarding_completed: true,
}, { onConflict: 'id' });
if (profileError) {
  await client.auth.admin.deleteUser(data.user.id);
  console.error('Profile creation failed; new login rolled back:', profileError.code);
  process.exit(1);
}
console.log('Lecturer created:', email);
console.log('Stream: BENG24COE-1; module: Web Application Development');
if (!process.env.LECTURER_SEED_PASSWORD) console.log('Initial password (save securely):', password);
