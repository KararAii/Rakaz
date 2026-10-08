import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Shell } from '@/components/Shell';
import { AbsencesPage } from '@/pages/Absences';
import { LiveTripsPage } from '@/pages/LiveTrips';
import { OverviewPage } from '@/pages/Overview';
import { RoutesPage } from '@/pages/Routes';
import { StudentsPage } from '@/pages/Students';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<OverviewPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="trips" element={<LiveTripsPage />} />
          <Route path="absences" element={<AbsencesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
