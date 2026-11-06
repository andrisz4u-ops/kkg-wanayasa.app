import { Hono } from 'hono';
import type { AppBindings, AppVariables } from '../types/env';
import { requireSession } from '../lib/session-middleware';

const aiJobs = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
aiJobs.use('*', requireSession);
aiJobs.post('/cancel-active', async c => {
  const user = c.get('user');
  await c.env.DB.prepare("UPDATE ai_generation_jobs SET state = 'cancelled' WHERE user_id = ? AND state = 'running'").bind(user.id).run();
  return c.json({ success: true, message: 'Proses aktif berhasil dibatalkan.' });
});
aiJobs.post('/:id/cancel', async c => {
  const user = c.get('user');
  await c.env.DB.prepare("UPDATE ai_generation_jobs SET state = 'cancelled' WHERE user_id = ? AND job_id = ? AND state = 'running'").bind(user.id, c.req.param('id')).run();
  return c.json({ success: true, message: 'Proses berhasil dibatalkan.' });
});
aiJobs.get('/:id', async c => {
  const job = await c.env.DB.prepare('SELECT state, result_json FROM ai_generation_jobs WHERE user_id = ? AND job_id = ? AND expires_at >= ?').bind(c.get('user').id, c.req.param('id'), Math.floor(Date.now() / 1000)).first<{ state: string; result_json: string | null }>();
  if (!job) return c.json({ success: false, message: 'Proses tidak ditemukan atau sudah kedaluwarsa.' }, 404);
  return c.json({ success: true, data: { state: job.state, result: job.result_json ? JSON.parse(job.result_json) : null } });
});
export default aiJobs;
