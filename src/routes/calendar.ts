import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import { createReservedCalendarEvent, repairCalendarReservation, syncUpcomingCalendarActivities, updateCalendarEvent } from '../lib/calendar-reservations';

type Bindings = { DB: D1Database };
type Variables = { user: any };

interface CalendarEvent {
    id?: number;
    title: string;
    description?: string;
    event_type?: string;
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    is_all_day?: boolean;
    color?: string;
    kegiatan_id?: number;
    created_by?: number;
}

const calendar = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get all events with optional date filtering
calendar.get('/events', async (c) => {
    try {
        const startDate = c.req.query('start') || '';
        const endDate = c.req.query('end') || '';
        const type = c.req.query('type') || '';
        const month = c.req.query('month') || ''; // Format: YYYY-MM

        let query = `
            SELECT ce.*, u.nama as creator_name, k.nama_kegiatan
            FROM calendar_events ce
            LEFT JOIN users u ON ce.created_by = u.id
            LEFT JOIN kegiatan k ON ce.kegiatan_id = k.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (month) {
            // Filter by month (YYYY-MM format)
            query += ` AND strftime('%Y-%m', ce.start_date) = ?`;
            params.push(month);
        } else {
            if (startDate) {
                query += ` AND ce.start_date >= ?`;
                params.push(startDate);
            }
            if (endDate) {
                query += ` AND ce.start_date <= ?`;
                params.push(endDate);
            }
        }

        if (type) {
            query += ` AND ce.event_type = ?`;
            params.push(type);
        }

        query += ` ORDER BY ce.start_date ASC, ce.start_time ASC LIMIT 200`;

        const stmt = c.env.DB.prepare(query);
        const results = params.length > 0
            ? await stmt.bind(...params).all()
            : await stmt.all();

        return successResponse(c, results.results);
    } catch (e: any) {
        console.error('Get calendar events error:', e);
        return Errors.internal(c);
    }
});

// Get single event
calendar.get('/events/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID event tidak valid');
        }

        const result = await c.env.DB.prepare(`
            SELECT ce.*, u.nama as creator_name, k.nama_kegiatan
            FROM calendar_events ce
            LEFT JOIN users u ON ce.created_by = u.id
            LEFT JOIN kegiatan k ON ce.kegiatan_id = k.id
            WHERE ce.id = ?
        `).bind(id).first();

        if (!result) {
            return Errors.notFound(c, 'Event');
        }

        return successResponse(c, result);
    } catch (e: any) {
        console.error('Get calendar event error:', e);
        return Errors.internal(c);
    }
});

// Create new event
calendar.post('/events', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const body = await c.req.json() as CalendarEvent;

        const validation = validateRequired(body, ['title', 'start_date']);
        if (!validation.valid) {
            return Errors.validation(c, 'Judul dan tanggal mulai harus diisi');
        }

        const {
            title, description, event_type, start_date, end_date,
            start_time, end_time, location, is_all_day, color, kegiatan_id
        } = body;

        if (kegiatan_id !== undefined && kegiatan_id !== null) {
            if (!Number.isInteger(kegiatan_id) || kegiatan_id <= 0) {
                return Errors.validation(c, 'ID kegiatan tidak valid');
            }
            const activity = await c.env.DB.prepare('SELECT id FROM kegiatan WHERE id = ?').bind(kegiatan_id).first();
            if (!activity) return Errors.validation(c, 'Kegiatan tidak ditemukan');
        }

        // Validate event type
        const validTypes = ['meeting', 'holiday', 'training', 'deadline', 'other'];
        if (event_type && !validTypes.includes(event_type)) {
            return Errors.validation(c, 'Tipe event tidak valid');
        }

        const values = [
            title.trim(), description?.trim() || null, event_type || 'meeting', start_date,
            end_date || start_date, start_time || null, end_time || null, location?.trim() || null,
            is_all_day ? 1 : 0, color || '#3B82F6', kegiatan_id ?? null, user.id,
        ];
        const insertedId = kegiatan_id != null
            ? await createReservedCalendarEvent(c.env.DB, { kegiatanId: kegiatan_id, eventValues: values })
            : Number((await c.env.DB.prepare(`
            INSERT INTO calendar_events 
            (title, description, event_type, start_date, end_date, start_time, end_time, location, is_all_day, color, kegiatan_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            ...values
        ).run()).meta.last_row_id);

        if (insertedId === null) return Errors.conflict(c, 'Kegiatan sudah memiliki event kalender');

        // Audit log
        await createAuditLog(c.env.DB, {
            user_id: user.id,
            action: 'KEGIATAN_CREATE',
            entity_type: 'calendar_event',
            entity_id: insertedId,
            details: { title, event_type, start_date },
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
        });

        return successResponse(c, {
            id: insertedId,
            title,
            start_date
        }, 'Event berhasil ditambahkan', 201);

    } catch (e: any) {
        console.error('Create calendar event error:', e);
        return Errors.internal(c);
    }
});

// Update event
calendar.put('/events/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const id = c.req.param('id');

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID event tidak valid');
        }

        const existing: any = await c.env.DB.prepare(
            'SELECT id, created_by, kegiatan_id FROM calendar_events WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Event');
        }

        // Check ownership or admin
        if (existing.created_by !== user.id && user.role !== 'admin') {
            return Errors.forbidden(c, 'Anda tidak memiliki akses untuk mengubah event ini');
        }

        const body = await c.req.json() as CalendarEvent;
        const {
            title, description, event_type, start_date, end_date,
            start_time, end_time, location, is_all_day, color, kegiatan_id
        } = body;
        const hasLinkField = Object.prototype.hasOwnProperty.call(body, 'kegiatan_id');
        const requestedKegiatanId = hasLinkField ? (kegiatan_id ?? null) : existing.kegiatan_id;
        const linkChanged = hasLinkField && requestedKegiatanId !== existing.kegiatan_id;
        const nextKegiatanId = linkChanged ? requestedKegiatanId : existing.kegiatan_id;
        if (linkChanged && nextKegiatanId !== null) {
            if (!Number.isInteger(nextKegiatanId) || nextKegiatanId <= 0) {
                return Errors.validation(c, 'ID kegiatan tidak valid');
            }
            const activity = await c.env.DB.prepare('SELECT id FROM kegiatan WHERE id = ?').bind(nextKegiatanId).first();
            if (!activity) return Errors.validation(c, 'Kegiatan tidak ditemukan');
        }

        const updated = await updateCalendarEvent(c.env.DB, {
            eventId: Number(id), userId: user.id, isAdmin: user.role === 'admin',
            linkChanged, kegiatanId: nextKegiatanId == null ? null : Number(nextKegiatanId),
            oldKegiatanId: existing.kegiatan_id == null ? null : Number(existing.kegiatan_id),
            updateValues: [
                Object.prototype.hasOwnProperty.call(body, 'title') ? 1 : 0, title?.trim() || null,
                Object.prototype.hasOwnProperty.call(body, 'description') ? 1 : 0,
                description == null || !description.trim() ? null : description.trim(),
                Object.prototype.hasOwnProperty.call(body, 'event_type') ? 1 : 0, event_type || null,
                Object.prototype.hasOwnProperty.call(body, 'start_date') ? 1 : 0, start_date || null,
                Object.prototype.hasOwnProperty.call(body, 'end_date') ? 1 : 0, end_date ?? null,
                Object.prototype.hasOwnProperty.call(body, 'start_time') ? 1 : 0, start_time ?? null,
                Object.prototype.hasOwnProperty.call(body, 'end_time') ? 1 : 0, end_time ?? null,
                Object.prototype.hasOwnProperty.call(body, 'location') ? 1 : 0,
                location == null || !location.trim() ? null : location.trim(),
                Object.prototype.hasOwnProperty.call(body, 'is_all_day') ? 1 : 0, is_all_day ? 1 : 0,
                Object.prototype.hasOwnProperty.call(body, 'color') ? 1 : 0, color || null,
            ],
        });
        if (!updated) return Errors.conflict(c, 'Kegiatan sudah memiliki event kalender atau event berubah');

        return successResponse(c, null, 'Event berhasil diperbarui');

    } catch (e: any) {
        console.error('Update calendar event error:', e);
        return Errors.internal(c);
    }
});

// Delete event
calendar.delete('/events/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const id = c.req.param('id');

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID event tidak valid');
        }

        const existing: any = await c.env.DB.prepare(
            'SELECT id, created_by, title, kegiatan_id FROM calendar_events WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Event');
        }

        // Check ownership or admin
        if (existing.created_by !== user.id && user.role !== 'admin') {
            return Errors.forbidden(c, 'Anda tidak memiliki akses untuk menghapus event ini');
        }

        const linkedKegiatanId = existing.kegiatan_id == null ? null : Number(existing.kegiatan_id);
        await c.env.DB.prepare('DELETE FROM calendar_events WHERE id = ?').bind(id).run();
        if (linkedKegiatanId !== null) await repairCalendarReservation(c.env.DB, linkedKegiatanId);

        // Audit log
        await createAuditLog(c.env.DB, {
            user_id: user.id,
            action: 'KEGIATAN_DELETE',
            entity_type: 'calendar_event',
            entity_id: Number(id),
            details: { title: existing.title },
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
        });

        return successResponse(c, null, 'Event berhasil dihapus');

    } catch (e: any) {
        console.error('Delete calendar event error:', e);
        return Errors.internal(c);
    }
});

// Get event types for filtering
calendar.get('/event-types', async (c) => {
    const types = [
        { value: 'meeting', label: 'Rapat', color: '#3B82F6', icon: 'fa-users' },
        { value: 'holiday', label: 'Libur', color: '#EF4444', icon: 'fa-umbrella-beach' },
        { value: 'training', label: 'Pelatihan', color: '#10B981', icon: 'fa-chalkboard-teacher' },
        { value: 'deadline', label: 'Deadline', color: '#F59E0B', icon: 'fa-clock' },
        { value: 'other', label: 'Lainnya', color: '#8B5CF6', icon: 'fa-calendar-alt' }
    ];
    return successResponse(c, types);
});

// Sync upcoming kegiatan to calendar
calendar.post('/sync-kegiatan', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user || user.role !== 'admin') {
        return Errors.forbidden(c, 'Hanya admin yang dapat melakukan sinkronisasi');
    }

    try {
        // Get kegiatan that are not yet synced
        const kegiatan = await c.env.DB.prepare(`
            SELECT id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi
            FROM kegiatan WHERE tanggal >= date('now')
        `).all();
        const synced = await syncUpcomingCalendarActivities(c.env.DB, (kegiatan.results || []) as any[], user.id);

        return successResponse(c, { synced }, `${synced} kegiatan berhasil disinkronkan ke kalender`);

    } catch (e: any) {
        console.error('Sync kegiatan error:', e);
        return Errors.internal(c);
    }
});

export default calendar;
