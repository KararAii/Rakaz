import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useState } from 'react';

import type { Coordinate, Student } from '@/types/models';

/** Navigation destination picked from the trip / student / map screens. */
export interface NavTarget {
  title: string;
  coordinate: Coordinate;
}

export interface UiStore {
  menuOpen: boolean;
  emergencyOpen: boolean;
  reorderOpen: boolean;
  navTarget: NavTarget | null;
  absentStudent: Student | null;
  openMenu(): void;
  closeMenu(): void;
  openEmergency(): void;
  closeEmergency(): void;
  openReorder(): void;
  closeReorder(): void;
  openNavigation(target: NavTarget): void;
  closeNavigation(): void;
  openAbsence(student: Student): void;
  closeAbsence(): void;
}

/** Which bottom sheet is presented over the main shell (mirrors the sheet flags in AppNavigation.kt). */
export const [UiStoreProvider, useUiStore] = createContextHook<UiStore>(() => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);
  const [absentStudent, setAbsentStudent] = useState<Student | null>(null);

  return useMemo<UiStore>(
    () => ({
      menuOpen,
      emergencyOpen,
      reorderOpen,
      navTarget,
      absentStudent,
      openMenu: () => setMenuOpen(true),
      closeMenu: () => setMenuOpen(false),
      openEmergency: () => setEmergencyOpen(true),
      closeEmergency: () => setEmergencyOpen(false),
      openReorder: () => setReorderOpen(true),
      closeReorder: () => setReorderOpen(false),
      openNavigation: (target) => setNavTarget(target),
      closeNavigation: () => setNavTarget(null),
      openAbsence: (student) => setAbsentStudent(student),
      closeAbsence: () => setAbsentStudent(null),
    }),
    [menuOpen, emergencyOpen, reorderOpen, navTarget, absentStudent],
  );
});
