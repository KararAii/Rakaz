import { todayISO } from '@rakaz/contract';

import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

export function OverviewPage() {
  const api = useAdminApi();
  const { data, error, reload } = useAsyncData(() => api.getOverview());

  const openTrips = async (): Promise<void> => {
    await api.openDailyTrips({ routeId: 'R-204', dateISO: todayISO() });
    reload();
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>نظرة عامة</h1>
          <p>مراقبة التشغيل اليومي وربط التطبيقات عبر نفس معرّفات Firebase.</p>
        </div>
        <button type="button" className="btn" onClick={() => void openTrips()}>
          فتح رحلات اليوم (R-204)
        </button>
      </div>

      {error ? <div className="card empty">{error}</div> : null}

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

      <div className="card">
        <h2 style={{ marginTop: 0 }}>عقد الربط</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          لوحة الإدارة تكتب مصدر الحقيقة: الطلاب <code>STU-*</code>، المسارات، وتعيين السائق. تطبيق السائق يكتب{' '}
          <code>trip_events</code>، وتطبيق ولي الأمر يستمع إلى <code>trips</code>. التفاصيل في <code>LINKING.md</code>.
        </p>
      </div>
    </section>
  );
}
