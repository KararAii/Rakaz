import {
  AlarmClock,
  Banknote,
  BriefcaseMedical,
  Bus,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  CircleEllipsis,
  CircleMinus,
  Clock,
  Contrast,
  CreditCard,
  Flag,
  House,
  Landmark,
  type LucideIcon,
  MapPin,
  Megaphone,
  Navigation,
  Plane,
  Smartphone,
  Stethoscope,
  TriangleAlert,
  Undo2,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react-native';

import { Theme } from '@/constants/theme';
import { AbsenceReason, AccountStatus, NotificationKind, PaymentMethod, TripStatus } from '@/types/models';

/** SF Symbol → lucide equivalents and tints, kept next to the models' `symbol`/`tint` properties. */

export const NotificationKindIcon: Record<NotificationKind, LucideIcon> = {
  [NotificationKind.tripReminder]: AlarmClock,
  [NotificationKind.tripStarted]: Bus,
  [NotificationKind.driverNear]: Navigation,
  [NotificationKind.pickedUp]: UserCheck,
  [NotificationKind.arrivedSchool]: Landmark,
  [NotificationKind.returnStarted]: Undo2,
  [NotificationKind.delivered]: House,
  [NotificationKind.payment]: CreditCard,
  [NotificationKind.delay]: TriangleAlert,
  [NotificationKind.admin]: Megaphone,
};

export function notificationTint(kind: NotificationKind): string {
  switch (kind) {
    case NotificationKind.tripReminder:
    case NotificationKind.tripStarted:
    case NotificationKind.returnStarted:
      return Theme.blue;
    case NotificationKind.driverNear:
      return Theme.gold;
    case NotificationKind.pickedUp:
    case NotificationKind.arrivedSchool:
    case NotificationKind.delivered:
      return Theme.green;
    case NotificationKind.payment:
      return Theme.teal;
    case NotificationKind.delay:
      return Theme.red;
    case NotificationKind.admin:
      return Theme.navy;
  }
}

export const AbsenceReasonIcon: Record<AbsenceReason, LucideIcon> = {
  [AbsenceReason.none]: CircleMinus,
  [AbsenceReason.sick]: BriefcaseMedical,
  [AbsenceReason.family]: Users,
  [AbsenceReason.travel]: Plane,
  [AbsenceReason.appointment]: Stethoscope,
  [AbsenceReason.other]: CircleEllipsis,
};

export const AccountStatusIcon: Record<AccountStatus, LucideIcon> = {
  [AccountStatus.paid]: CircleCheck,
  [AccountStatus.partiallyPaid]: Contrast,
  [AccountStatus.overdue]: CircleAlert,
  [AccountStatus.unpaid]: CalendarClock,
};

export const AccountStatusTint: Record<AccountStatus, string> = {
  [AccountStatus.paid]: Theme.green,
  [AccountStatus.partiallyPaid]: Theme.gold,
  [AccountStatus.overdue]: Theme.red,
  [AccountStatus.unpaid]: Theme.muted,
};

export const AccountStatusSoft: Record<AccountStatus, string> = {
  [AccountStatus.paid]: Theme.greenSoft,
  [AccountStatus.partiallyPaid]: Theme.goldSoft,
  [AccountStatus.overdue]: Theme.redSoft,
  [AccountStatus.unpaid]: Theme.blueSoft,
};

export const PaymentMethodIcon: Record<PaymentMethod, LucideIcon> = {
  [PaymentMethod.cash]: Banknote,
  [PaymentMethod.card]: CreditCard,
  [PaymentMethod.zainCash]: Smartphone,
  [PaymentMethod.bankTransfer]: Landmark,
};

export const TripStatusIcon: Record<TripStatus, LucideIcon> = {
  [TripStatus.notStarted]: Clock,
  [TripStatus.preparing]: Wrench,
  [TripStatus.driverOnTheWay]: Bus,
  [TripStatus.arrivedAtPickup]: MapPin,
  [TripStatus.studentPickedUp]: UserCheck,
  [TripStatus.onTheWayToSchool]: Navigation,
  [TripStatus.arrivedAtSchool]: Landmark,
  [TripStatus.finished]: Flag,
};

export function tripStatusTint(status: TripStatus): string {
  switch (status) {
    case TripStatus.notStarted:
      return Theme.muted;
    case TripStatus.preparing:
      return Theme.blue;
    case TripStatus.driverOnTheWay:
    case TripStatus.onTheWayToSchool:
      return Theme.gold;
    case TripStatus.arrivedAtPickup:
      return Theme.red;
    case TripStatus.studentPickedUp:
    case TripStatus.arrivedAtSchool:
    case TripStatus.finished:
      return Theme.green;
  }
}