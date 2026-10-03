import SwiftUI

struct ReportAbsenceSheet: View {
    @Environment(FamilyStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var day: Date = Calendar.current.startOfDay(for: .now)
    @State private var scope: AbsenceScope = .fullDay
    @State private var reason: AbsenceReason = .none
    @State private var note: String = ""
    @State private var sent: Bool = false

    private var days: [Date] {
        let cal = Calendar.current
        let start = cal.startOfDay(for: .now)
        return (0..<10).compactMap { cal.date(byAdding: .day, value: $0, to: start) }
            .filter { !cal.isDateInWeekend($0) || cal.component(.weekday, from: $0) == 1 }
            .prefix(7)
            .map { $0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if sent { confirmation } else { form }
            }
            .background(Theme.canvas)
            .navigationTitle("إبلاغ غياب")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("إغلاق") { dismiss() }
                }
            }
        }
        .presentationDragIndicator(.visible)
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 12) {
                Avatar(imageName: store.student.photoName, initials: String(store.student.firstName.prefix(1)), size: 46, tint: Theme.gold)
                VStack(alignment: .leading, spacing: 2) {
                    Text("الطالب").font(.plex(.caption)).foregroundStyle(Theme.muted)
                    Text(store.student.fullName)
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                }
                Spacer()
            }
            .card(padding: 12, radius: 18)

            if store.students.count > 1 {
                StudentSwitcher().padding(.horizontal, -16)
            }

            label("اليوم")
            ScrollView(.horizontal) {
                HStack(spacing: 8) {
                    ForEach(days, id: \.self) { d in
                        let selected = Calendar.current.isDate(d, inSameDayAs: day)
                        Button {
                            Haptics.selection()
                            withAnimation(.snappy) { day = d }
                        } label: {
                            VStack(spacing: 4) {
                                Text(Calendar.current.isDateInToday(d) ? "اليوم" : (Calendar.current.isDateInTomorrow(d) ? "غداً" : weekday(d)))
                                    .font(.plex(.caption2, .semibold))
                                Text(Fmt.digits(String(Calendar.current.component(.day, from: d))))
                                    .font(.plex(.title3, .bold))
                            }
                            .foregroundStyle(selected ? .white : Theme.ink)
                            .frame(width: 64, height: 70)
                            .background(selected ? Theme.navy : Theme.card, in: .rect(cornerRadius: 16))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }
            .scrollIndicators(.hidden)
            .contentMargins(.horizontal, 16)
            .padding(.horizontal, -16)

            label("الرحلات")
            Picker("الرحلات", selection: $scope) {
                ForEach(AbsenceScope.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)

            label("السبب (اختياري)")
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
                ForEach(AbsenceReason.allCases, id: \.self) { r in
                    let selected = reason == r
                    Button {
                        Haptics.selection()
                        reason = r
                    } label: {
                        Label(r.title, systemImage: r.symbol)
                            .font(.plex(.footnote, .semibold))
                            .foregroundStyle(selected ? .white : Theme.ink)
                            .frame(maxWidth: .infinity, minHeight: 42)
                            .background(selected ? Theme.gold : Theme.card, in: .capsule)
                    }
                    .buttonStyle(PressableStyle())
                }
            }

            label("ملاحظة")
            TextField("مثال: سيعود الطالب للدوام يوم الأحد", text: $note, axis: .vertical)
                .lineLimit(3...6)
                .padding(14)
                .background(Theme.card, in: .rect(cornerRadius: 16))

            HStack(spacing: 8) {
                Image(systemName: "eye.fill")
                Text("سيظهر البلاغ للإدارة والسائق فوراً")
            }
            .font(.plex(.caption, .medium))
            .foregroundStyle(Theme.muted)

            Button {
                store.reportAbsence(day: day, scope: scope, reason: reason, note: note)
                withAnimation(.spring) { sent = true }
            } label: {
                Label("إرسال البلاغ", systemImage: "paperplane.fill")
            }
            .buttonStyle(PrimaryButtonStyle(fill: Theme.red))
        }
        .padding(16)
    }

    private var confirmation: some View {
        VStack(spacing: 14) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 66))
                .foregroundStyle(Theme.green)
                .symbolEffect(.bounce, options: .nonRepeating)
            Text("تم إرسال بلاغ الغياب")
                .font(.plex(.title2, .bold))
                .foregroundStyle(Theme.ink)
            Text("\(store.student.firstName) غائب \(Calendar.current.isDateInToday(day) ? "اليوم" : Fmt.shortDay(day)) · \(scope.title)")
                .font(.plex(.subheadline))
                .foregroundStyle(Theme.muted)
            HStack(spacing: 10) {
                recipient("الإدارة", "building.2.fill")
                recipient("السائق", "bus.fill")
            }
            .padding(.top, 6)
            Button("تم") { dismiss() }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.top, 10)
        }
        .padding(24)
        .padding(.top, 30)
        .transition(.scale.combined(with: .opacity))
    }

    private func recipient(_ title: String, _ symbol: String) -> some View {
        Label("أُرسل إلى \(title)", systemImage: symbol)
            .font(.plex(.caption, .bold))
            .foregroundStyle(Theme.green)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Theme.greenSoft, in: .capsule)
    }

    private func label(_ text: String) -> some View {
        Text(text)
            .font(.plex(.subheadline, .bold))
            .foregroundStyle(Theme.ink)
    }

    private func weekday(_ d: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar")
        f.dateFormat = "EEE"
        return f.string(from: d)
    }
}
