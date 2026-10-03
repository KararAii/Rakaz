import SwiftUI

struct NotificationsView: View {
    @Environment(FamilyStore.self) private var store
    @State private var category: NotificationCategory = .all

    private var filtered: [AppNotification] {
        category == .all ? store.notifications : store.notifications.filter { $0.kind.category == category }
    }

    var body: some View {
        List {
            Picker("التصنيف", selection: $category) {
                ForEach(NotificationCategory.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 8, trailing: 16))

            if filtered.isEmpty {
                ContentUnavailableView("لا توجد إشعارات", systemImage: "bell.slash")
                    .listRowBackground(Color.clear)
            }

            ForEach(filtered) { n in
                HStack(alignment: .top, spacing: 12) {
                    IconBadge(symbol: n.kind.symbol, tint: n.kind.tint, soft: n.kind.tint.opacity(0.12), size: 42)
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(n.kind.title)
                                .font(.plex(.subheadline, .bold))
                                .foregroundStyle(Theme.ink)
                            Spacer()
                            Text(Fmt.relative(n.date))
                                .font(.plex(.caption2))
                                .foregroundStyle(Theme.muted)
                        }
                        Text(n.body)
                            .font(.plex(.footnote))
                            .foregroundStyle(Theme.muted)
                    }
                    if !n.isRead {
                        Circle().fill(Theme.gold).frame(width: 8, height: 8).padding(.top, 6)
                    }
                }
                .padding(.vertical, 4)
                .listRowBackground(n.isRead ? Theme.card : Theme.goldSoft.opacity(0.6))
                .contentShape(.rect)
                .onTapGesture { withAnimation(.snappy) { store.markRead(n.id) } }
                .swipeActions {
                    Button("حذف", role: .destructive) { store.deleteNotification(n.id) }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.canvas)
        .navigationTitle("الإشعارات")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("تعيين الكل كمقروء", systemImage: "checkmark.circle") { store.markAllRead() }
                    NavigationLink(value: Route.notificationSettings) {
                        Label("إعدادات الإشعارات", systemImage: "slider.horizontal.3")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
    }
}

struct NotificationSettingsView: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        @Bindable var store = store
        List {
            Section {
                ForEach(NotificationKind.allCases, id: \.self) { kind in
                    Toggle(isOn: Binding(
                        get: { store.preferences.isOn(kind) },
                        set: { store.preferences.enabled[kind.rawValue] = $0; Haptics.selection() }
                    )) {
                        Label {
                            Text(kind.title).font(.plex(.subheadline, .semibold))
                        } icon: {
                            Image(systemName: kind.symbol).foregroundStyle(kind.tint)
                        }
                    }
                    .tint(Theme.gold)
                }
            } header: {
                Text("الإشعارات الفورية (Push)")
            } footer: {
                Text("اختر الإشعارات التي ترغب باستلامها. إشعارات السلامة مثل الاستلام والتسليم موصى بإبقائها مفعّلة.")
            }

            Section {
                Button("تجربة إشعار «السائق قريب»", systemImage: "bell.and.waves.left.and.right") {
                    store.push(.driverNear, "السائق على بُعد ٥ دقائق من المنزل. يُرجى تجهيز \(store.student.firstName).")
                }
                .foregroundStyle(Theme.navy)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.canvas)
        .navigationTitle("إعدادات الإشعارات")
        .navigationBarTitleDisplayMode(.inline)
    }
}
