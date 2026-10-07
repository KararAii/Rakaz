import type { ParentCommandApi, RakazAbsenceReport, RakazAddressUpdate, RakazHandoverResult } from '@rakaz/contract';

/**
 * Local command sink — logs only.
 * familyStore still owns local state; when switching to Firebase, call these after local patch.
 */
export function createLocalParentCommands(): ParentCommandApi {
  return {
    async reportAbsence(report: RakazAbsenceReport): Promise<void> {
      if (__DEV__) console.log('[RakazLink/local] absence', report.studentId, report.scope);
    },
    async updateAddress(update: RakazAddressUpdate): Promise<void> {
      if (__DEV__) console.log('[RakazLink/local] address', update.studentId);
    },
    async confirmHandover(result: RakazHandoverResult): Promise<void> {
      if (__DEV__) console.log('[RakazLink/local] handover confirmed', result.tripId);
    },
    async reportHandoverIssue(result: RakazHandoverResult): Promise<void> {
      if (__DEV__) console.log('[RakazLink/local] handover issue', result.tripId);
    },
  };
}
