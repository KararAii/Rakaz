import { useState } from 'react';

import { todayISO } from '@rakaz/contract';

import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';
import { DASHBOARD_BACKEND_MODE, getRakazApiUrl } from '@/services/backend';

export function OverviewPage() {
  const api = useAdminApi();
  const { data, error, reload } = useAsyncData(() => api.getOverview(), []);
  const [title, setTitle] = useState('تنبيه من الإدارة');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const openTrips = async (): Promise<void> => {
    setNotice(null);
    try {
      const result = await api.openDailyTrips({ routeId: 'R-204', dateISO: todayISO() });
      setNotice(`فُتحت الرحلات: ${result.morningTripId} / ${result.afternoonTripId}`);
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    }
  };

  const broadcast = async (): Promise<void> => {
    setNotice(null);
    try {
      await api.broadcastAdminNotice({ title, body, routeId: 'R-204' });
      setNotice('أُرسل الإشعار لأولياء أمور المسار');
      setBody('');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>نظرة عامة</h1>
          <p>
            وضع الربط: <b>{DASHBOARD_BACKEND_MODE}</b> · API: <code>{getRakazApiUrl()}</code>
          </p>
        </div>
        <button type="button" className="btn" onClick={() => void openTrips()}>
          فتح رحلات اليوم (R-204)
        </button>
      </div>

      {error ? <div className="card empty">{error}</div> : null}
      {notice ? <div className="card">{notice}</div> : null}

      <div className="grid stats">
        <div className="card stat">
          <div className="label">رحلات نشطة</div>
          <div className="value">{data?.activeTrips ?? '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">طلاب في المركبة</div>
          <div className="value">{data?.studentsOnBoard ?? '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">غيابات اليوم</div>
          <div className="value">{data?.absencesToday ?? '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">بانتظار الاستلام</div>
          <div className="value">{data?.openHandovers ?? '—'}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>بث إشعار إداري</h2>
        <div className="form-grid">
          <label>
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            النص
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="مثال: عطلة رسمية غداً" />
          </label>
        </div>
        <button type="button" className="btn secondary" disabled={!body.trim()} onClick={() => void broadcast()}>
          إرسال لمسار R-204
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>عقد الربط</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          لوحة الإدارة تكتب مصدر الحقيقة عبر <code>rakaz-api</code>. السائق يرسل <code>trip_events</code>، وولي الأمر يستمع إلى{' '}
          <code>trips</code>، والغياب ينعكس للسائق عند المزامنة. التفاصيل في <code>LINKING.md</code>.
        </p>
        <button type="button" className="btn secondary" onClick={reload}>
          تحديث المؤشرات
        </button>
      </div>
    </section>
  );
}
