import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

export function StudentsPage() {
  const api = useAdminApi();
  const { data, error } = useAsyncData(() => api.listStudents());

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>الطلاب</h1>
          <p>المعرّفات هنا هي نفسها في تطبيق ولي الأمر والسائق بعد التوحيد.</p>
        </div>
      </div>
      {error ? <div className="card empty">{error}</div> : null}
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
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && !error ? <div className="empty">لا يوجد طلاب</div> : null}
      </div>
    </section>
  );
}
