import { useAdminApi, useAsyncData } from '@/hooks/useAdmin';

export function RoutesPage() {
  const api = useAdminApi();
  const routes = useAsyncData(() => api.listRoutes());
  const drivers = useAsyncData(() => api.listDrivers());

  const driverName = (uid: string | null): string => {
    if (!uid) return 'غير معيّن';
    return drivers.data?.find((d) => d.uid === uid)?.name ?? uid;
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>المسارات</h1>
          <p>تعيين السائق وترتيب المحطات ينعكس على تطبيق السائق.</p>
        </div>
      </div>
      {routes.error ? <div className="card empty">{routes.error}</div> : null}
      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        {(routes.data ?? []).map((route) => (
          <div key={route.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <div>
                <h2 style={{ margin: 0 }}>{route.name}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  <code>{route.id}</code> · السائق: {driverName(route.driverUid)}
                </p>
              </div>
              <span className={`badge ${route.active ? 'live' : 'idle'}`}>{route.active ? 'نشط' : 'متوقف'}</span>
            </div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الطالب</th>
                    <th>الاستلام</th>
                    <th>التسليم</th>
                  </tr>
                </thead>
                <tbody>
                  {route.stops.map((stop) => (
                    <tr key={stop.studentId}>
                      <td>{stop.sequence}</td>
                      <td>
                        <code>{stop.studentId}</code>
                      </td>
                      <td>{stop.pickupTime}</td>
                      <td>{stop.dropoffTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
