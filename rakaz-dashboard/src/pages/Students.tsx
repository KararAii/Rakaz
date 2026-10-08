import { useState } from 'react';

import type { RakazAdminStudent } from '@rakaz/contract';

import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

const emptyStudent = (): RakazAdminStudent => ({
  id: `STU-${Date.now().toString().slice(-5)}`,
  internalNumber: `RKZ-${Date.now().toString().slice(-5)}`,
  fullName: '',
  firstName: '',
  grade: 'الصف الرابع',
  schoolId: 'sch-basra-1',
  schoolName: 'مدارس البصرة الأهلية',
  routeId: 'R-204',
  guardianName: '',
  guardianPhone: '',
  home: { latitude: 30.52, longitude: 47.78 },
  active: true,
});

export function StudentsPage() {
  const api = useAdminApi();
  const { data, error, reload } = useAsyncData(() => api.listStudents());
  const [draft, setDraft] = useState<RakazAdminStudent>(emptyStudent());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (): Promise<void> => {
    setSaving(true);
    setMessage(null);
    try {
      const firstName = draft.firstName || draft.fullName.split(' ')[0] || draft.fullName;
      const student = { ...draft, firstName };
      await api.upsertStudent(student);
      if (student.routeId) {
        const sequence = (data?.length ?? 0) + 1;
        await api.assignStudentToRoute(student.id, student.routeId, sequence);
      }
      setMessage('تم حفظ الطالب');
      setDraft(emptyStudent());
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
          <h1>الطلاب</h1>
          <p>المعرّفات هنا هي نفسها في تطبيق ولي الأمر والسائق بعد التوحيد.</p>
        </div>
      </div>
      {error ? <div className="card empty">{error}</div> : null}
      {message ? <div className="card">{message}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>إضافة / تحديث طالب</h2>
        <div className="form-grid">
          <label>
            المعرف (STU-*)
            <input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </label>
          <label>
            الرقم الداخلي
            <input value={draft.internalNumber} onChange={(e) => setDraft({ ...draft, internalNumber: e.target.value })} />
          </label>
          <label>
            الاسم الكامل
            <input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
          </label>
          <label>
            الصف
            <input value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })} />
          </label>
          <label>
            المسار
            <input value={draft.routeId ?? ''} onChange={(e) => setDraft({ ...draft, routeId: e.target.value || null })} />
          </label>
          <label>
            ولي الأمر
            <input value={draft.guardianName} onChange={(e) => setDraft({ ...draft, guardianName: e.target.value })} />
          </label>
          <label>
            هاتف ولي الأمر
            <input value={draft.guardianPhone} onChange={(e) => setDraft({ ...draft, guardianPhone: e.target.value })} />
          </label>
        </div>
        <button type="button" className="btn" disabled={saving || !draft.fullName} onClick={() => void save()}>
          حفظ الطالب
        </button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>المعرّف</th>
              <th>الرقم الداخلي</th>
              <th>الاسم</th>
              <th>الصف</th>
              <th>المسار</th>
              <th>ولي الأمر</th>
              <th>الهاتف</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id}>
                <td>
                  <code>{s.id}</code>
                </td>
                <td>{s.internalNumber}</td>
                <td>{s.fullName}</td>
                <td>{s.grade}</td>
                <td>{s.routeId ?? '—'}</td>
                <td>{s.guardianName}</td>
                <td>{s.guardianPhone}</td>
                <td>
                  <button type="button" className="btn secondary" onClick={() => setDraft(s)}>
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && !error ? <div className="empty">لا يوجد طلاب</div> : null}
      </div>
    </section>
  );
}
