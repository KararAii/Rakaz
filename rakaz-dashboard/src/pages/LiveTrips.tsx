import { useEffect, useState } from 'react';

import { ParentTripStatus, type RakazTripSnapshot } from '@rakaz/contract';

import { useAdminApi } from '@/hooks/useAdmin';

const statusLabel: Record<number, string> = {
  [ParentTripStatus.notStarted]: 'لم تبدأ',
  [ParentTripStatus.preparing]: 'استعداد',
  [ParentTripStatus.driverOnTheWay]: 'في الطريق',
  [ParentTripStatus.arrivedAtPickup]: 'عند نقطة الاستلام',
  [ParentTripStatus.studentPickedUp]: 'تم الاستلام',
  [ParentTripStatus.onTheWayToSchool]: 'إلى الوجهة',
  [ParentTripStatus.arrivedAtSchool]: 'وصلت',
  [ParentTripStatus.finished]: 'انتهت',
};

export function LiveTripsPage() {
  const api = useAdminApi();
  const [trips, setTrips] = useState<RakazTripSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      return api.watchLiveTrips(setTrips);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return undefined;
    }
  }, [api]);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>الرحلات الحية</h1>
          <p>بث مباشر من وثائق <code>trips</code> — نفس ما يقرأه ولي الأمر.</p>
        </div>
      </div>
      {error ? <div className="card empty">{error}</div> : null}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>الرحلة</th>
              <th>النوع</th>
              <th>المسار</th>
              <th>الحالة</th>
              <th>التقدم</th>
              <th>الاستلام</th>
              <th>آخر تحديث</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.tripId}>
                <td>
                  <code>{trip.tripId}</code>
                </td>
                <td>{trip.tripKind === 'morning' ? 'ذهاب' : 'عودة'}</td>
                <td>{trip.routeId}</td>
                <td>
                  <span className={`badge ${trip.status > 0 && trip.status < 7 ? 'live' : 'idle'}`}>
                    {statusLabel[trip.status] ?? trip.status}
                  </span>
                </td>
                <td>{Math.round(trip.progress * 100)}%</td>
                <td>{trip.handoverPending ? <span className="badge warn">بانتظار التأكيد</span> : '—'}</td>
                <td>{new Date(trip.updatedAt).toLocaleTimeString('ar-IQ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!trips.length && !error ? <div className="empty">لا توجد رحلات حية — افتح رحلات اليوم من النظرة العامة</div> : null}
      </div>
    </section>
  );
}
