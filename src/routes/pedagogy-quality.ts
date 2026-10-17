import { Hono } from 'hono';
import { requireSession } from '../lib/session-middleware';
import { Errors, successResponse } from '../lib/response';
import type { AppBindings, AppVariables } from '../types/env';

const pedagogyQuality = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
pedagogyQuality.use('*', requireSession);

pedagogyQuality.get('/teacher-reviews', async c => {
  if (c.get('user')?.role !== 'admin') return Errors.forbidden(c, 'Endpoint ini hanya untuk administrator');

  const result = await c.env.DB.prepare(`
    SELECT
      d.module,
      COUNT(*) AS denominator,
      SUM(CASE WHEN active.status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
      SUM(CASE WHEN active.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN active.status IS NULL THEN 1 ELSE 0 END) AS needs_review
    FROM document_drafts d
    LEFT JOIN document_teacher_reviews active
      ON active.id = (
        SELECT r.id
        FROM document_teacher_reviews r
        WHERE r.user_id = d.user_id AND r.module = d.module
          AND r.document_id = d.document_id AND r.revision = d.revision
        ORDER BY r.id DESC LIMIT 1
      )
    GROUP BY d.module
    ORDER BY d.module ASC
  `).all();
  const groups = (result.results || []).map((row: any) => ({
    module: row.module,
    denominator: Number(row.denominator),
    needs_review: Number(row.needs_review),
    reviewed: Number(row.reviewed),
    rejected: Number(row.rejected),
  }));
  const totals = groups.reduce((total, group) => ({
    denominator: total.denominator + group.denominator,
    needs_review: total.needs_review + group.needs_review,
    reviewed: total.reviewed + group.reviewed,
    rejected: total.rejected + group.rejected,
  }), { denominator: 0, needs_review: 0, reviewed: 0, rejected: 0 });

  return successResponse(c, {
    scope: 'current private server drafts',
    ...totals,
    modules: groups.filter(group => group.denominator >= 5),
    suppressed_module_cohorts: groups.filter(group => group.denominator < 5).length,
  });
});

export default pedagogyQuality;
