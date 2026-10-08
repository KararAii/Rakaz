import { useState } from 'react';

import type { RakazAdminDriver } from '@rakaz/contract';

import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

const emptyDriver = (): RakazAdminDriver => ({
  uid: `drv-${Date.now().toString().slice(-4)}`,
  name: '',
  phone: '',
  vehicleLabel: '',
  plateNumber: '',
  routeId: 'R-204',
  active: true,
});

export function DriversPage() {
  const api = useAdminApi();
  const { data, error, reload } = useAsyncData(() => api.listDrivers());
  const [draft, setDraft] = useState<RakazAdminDriver>(emptyDriver());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (): Promise<void> => {
    setSaving(true);
    setMessage(null);
    try {
      await api.upsertDriver(draft);
      if (draft.routeId) await api.assignDriverToRoute(draft.uid, draft.routeId);
      setMessage('تم حفظ السائق');
      setDraft(emptyDriver());
      reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>السائقون</h1>
          <p>تعيين السائق للمسار يصل لتطبيق السائق عبر الباكند المشترك.</p>
        </div>
      </div>
      {error ? <div className="card empty">{error}</div> : null}
      {message ? <div className="card">{message}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>إضافة / تحديث سائق</h2>
        <div className="form-grid">
          <label>
            المعرف
            <input value={draft.uid} onChange={(e) => setDraft({ ...draft, uid: e.target.value })} />
          </label>
          <label>
            الاسم
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label>
            الهاتف
            <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </label>
          <label>
            المركبة
            <input value={draft.vehicleLabel} onChange={(e) => setDraft({ ...draft, vehicleLabel: e.target.value })} />
          </label>
          <label>
            اللوحة
            <input value={draft.plateNumber} onChange={(e) => setDraft({ ...draft, plateNumber: e.target.value })} />
          </label>
          <label>
            المسار
            <input value={draft.routeId ?? ''} onChange={(e) => setDraft({ ...draft, routeId: e.target.value || null })} />
          </label>
        </div>
        <button type="button" className="btn" disabled={saving || !draft.name} onClick={() => void save()}>
          حفظ السائق
        </button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>المعرف</th>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>المركبة</th>
              <th>المسار</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((d) => (
              <tr key={d.uid}>
                <td>
                  <code>{d.uid}</code>
                </td>
                <td>{d.name}</td>
                <td>{d.phone}</td>
                <td>
                  {d.vehicleLabel} · {d.plateNumber}
                </td>
                <td>{d.routeId ?? '—'}</td>
                <td>
                  <span className={`badge ${d.active ? 'live' : 'idle'}`}>{d.active ? 'نشط' : 'متوقف'}</span>
                </td>
                <td>
                  <button type="button" className="btn secondary" onClick={() => setDraft(d)}>
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
