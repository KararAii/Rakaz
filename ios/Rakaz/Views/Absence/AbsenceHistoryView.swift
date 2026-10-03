import SwiftUI

struct AbsenceHistoryView: View {
    @Environment(FamilyStore.self) private var store
    @State private var showReport: Bool = false

    var body: some View {
        let items = store.absences(for: store.selectedStudentID)
        List {
            if store.students.count > 1 {
                StudentSwitcher()
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
            }
            if items.isEmpty {
                ContentUnavailableView("لا توجد بلاغات غياب", systemImage: "calendar.badge.checkmark", description: Text("عند إبلاغ الغياب سيظهر هنا مع حالة اطّلاع الإدارة والسائق."))
                    .listRowBackground(Color.clear)
            } else {
                Section("البلاغات") {
                    ForEach(items) { a in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(Fmt.shortDay(a.day))
                                    .font(.plex(.subheadline, .bold))
                                    .foregroundStyle(Theme.ink)
                                Spacer()
                                StatusPill(title: a.scope.title, tint: Theme.red, soft: Theme.redSoft)
                            }
                            Label(a.reason.title, systemImage: a.reason.symbol)
                                .font(.plex(.caption, .semibold))
                                .foregroundStyle(Theme.muted)
                            if !a.note.isEmpty {
                                Text(a.note).font(.plex(.footnote)).foregroundStyle(Theme.ink)
                            }
                            HStack(spacing: 12) {
                                seen("الإدارة", a.seenByAdmin)
                                seen("السائق", a.seenByDriver)
                            }
                        }
                        .padding(.vertical, 4)
                        .swipeActions {
                            Button("إلغاء", role: .destructive) { store.cancelAbsence(a.id) }
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.canvas)
        .navigationTitle("سجل الغياب")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showReport = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("إبلاغ غياب")
            }
        }
        .sheet(isPresented: $showReport) { ReportAbsenceSheet() }
    }

    private func seen(_ who: String, _ ok: Bool) -> some View {
        Label(ok ? "اطّلع \(who)" : "بانتظار \(who)", systemImage: ok ? "checkmark.circle.fill" : "clock")
            .font(.plex(.caption))
            .foregroundStyle(ok ? Theme.green : Theme.muted)
    }
}
