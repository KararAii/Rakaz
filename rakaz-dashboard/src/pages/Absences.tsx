import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

const scopeTitle: Record<string, string> = {
  fullDay: 'اليوم كاملاً',
  morningOnly: 'الذهاب فقط',
  returnOnly: 'العودة فقط',
};

export function AbsencesPage() {
  const api = useAdminApi();
  const { data, error } = useAsyncData(() => api.listAbsencesToday());

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>الغياب</h1>
          <p>بلاغات ولي الأمر من مجموعة <code>absences</code> — تظهر أيضاً للسائق.</p>
        </div>
      </div>
      {error ? <div className="card empty">{error}</div> : null}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>الطالب</th>
              <th>النطاق</th>
              <th>السبب</th>
              <th>ملاحظة</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td>
                  <code>{a.studentId}</code>
                </td>
                <td>{scopeTitle[a.scope] ?? a.scope}</td>
                <td>{a.reason}</td>
                <td>{a.note || '—'}</td>
                <td>{new Date(a.createdAt).toLocaleTimeString('ar-IQ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && !error ? <div className="empty">لا غيابات اليوم</div> : null}
      </div>
    </section>
  );
}
