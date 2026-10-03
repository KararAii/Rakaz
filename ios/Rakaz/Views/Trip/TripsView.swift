import SwiftUI

/// "رحلات اليوم": daily schedule, both trips as cards, pickup confirmations and the upcoming driver.
struct TripsView: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        BrandScreen(overlap: 76) {
            header
        } content: {
            scheduleCard
            SectionTitle(title: "خط سير \(store.student.firstName)", action: "تحديث", actionSymbol: "arrow.clockwise") {
                store.restartDemo()
            }
            TripCard(kind: .morning)
            TripCard(kind: .afternoon)
            confirmations
            driverStrip
            helpStrip
            Label("آخر تحديث للجدول \(Fmt.relative(store.activeTrip.updatedAt))", systemImage: "mappin.circle")
                .font(.plex(.caption))
                .foregroundStyle(Theme.muted)
                .padding(.top, 2)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 16) {
            HeaderBar(
                leading: ("person", false, { store.tab = .family }),
                trailing: ("bell", store.unreadCount > 0, { store.showNotifications = true })
            ) {
                LogoBadge(height: 36)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("متابعة رحلات \(store.student.guardianName.split(separator: " ").first.map { "عائلة \($0)" } ?? "العائلة")")
                    .font(.plex(.subheadline))
                    .foregroundStyle(.white.opacity(0.7))
                HStack(alignment: .lastTextBaseline) {
                    Text("رحلات اليوم")
                        .font(.plex(size: 30, .bold, relativeTo: .largeTitle))
                        .foregroundStyle(.white)
                    Spacer()
                    Text(Fmt.dayDate(.now))
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.55))
                }
            }
            if store.students.count > 1 {
                StudentSwitcher(dark: true).padding(.horizontal, -20)
            }
        }
    }

    private var scheduleCard: some View {
        VStack(spacing: 14) {
            HStack(spacing: 12) {
                IconBadge(symbol: "calendar", tint: Theme.ink, soft: Theme.blueSoft, size: 44)
                VStack(alignment: .leading, spacing: 1) {
                    Text("الجدول اليومي")
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                    Text("رحلتان مقررتان لـ\(store.student.firstName)")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                }
                Spacer()
                StatusPill(title: "اليوم", tint: Theme.greenDeep, soft: Theme.greenSoft)
            }
            HStack(spacing: 10) {
                slot(.morning, bg: Color(hex: 0xF1F5F7))
                slot(.afternoon, bg: Theme.cream)
            }
        }
        .card(padding: 16, radius: 26)
        .shadow(color: Theme.navy.opacity(0.08), radius: 24, y: 12)
    }

    private func slot(_ kind: TripKind, bg: Color) -> some View {
        let trip = store.trip(kind)
        let absent = store.isAbsent(on: kind)
        return Button {
            store.open(.liveTrip(kind))
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(kind == .morning ? "الذهاب" : "العودة")
                    .font(.plex(.caption))
                    .foregroundStyle(kind == .morning ? Theme.muted : Theme.gold)
                Text(Fmt.clock(trip.scheduledStart))
                    .font(.plex(.title2, .bold))
                    .foregroundStyle(Theme.ink)
                Text(absent ? "غياب مُبلَّغ" : slotNote(trip))
                    .font(.plex(.caption))
                    .foregroundStyle(absent ? Theme.red : Theme.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(bg, in: .rect(cornerRadius: 16))
        }
        .buttonStyle(PressableStyle())
    }

    private func slotNote(_ trip: Trip) -> String {
        if trip.isPickedUp { return trip.hasArrived ? "وصلت بأمان ✓" : "تم الالتقاط ✓" }
        if trip.status.isActive { return trip.status.title(for: trip.kind) }
        let mins = Int(trip.scheduledStart.timeIntervalSinceNow / 60)
        if mins > 60 { return "بعد \(Fmt.digits(String(mins / 60))) ساعات" }
        if mins > 0 { return "بعد \(Fmt.minutes(mins))" }
        return "مجدولة"
    }

    private var confirmations: some View {
        let m = store.morningTrip
        let r = store.returnTrip
        let name = store.student.firstName
        return VStack(alignment: .leading, spacing: 10) {
            SectionTitle(title: "تأكيدات الاستلام")
            VStack(spacing: 0) {
                confirmationRow(
                    done: m.isPickedUp,
                    title: m.isPickedUp ? "تم استلام \(name) بأمان" : "بانتظار استلام \(name)",
                    subtitle: m.eventDate(for: .studentPickedUp).map { "من المنزل · \(Fmt.time($0))" } ?? "رحلة الذهاب"
                )
                RowDivider(inset: 60)
                confirmationRow(
                    done: m.hasArrived,
                    title: m.hasArrived ? "وصلت \(name) إلى المدرسة" : "الوصول إلى المدرسة",
                    subtitle: m.eventDate(for: .arrivedAtSchool).map { "عند بوابة المدرسة · \(Fmt.time($0))" } ?? "متوقع \(Fmt.clock(store.etaDate(.morning)))"
                )
                RowDivider(inset: 60)
                confirmationRow(
                    done: store.handoverConfirmedAt != nil,
                    title: store.handoverConfirmedAt != nil ? "أكدتَ استلام \(name) في المنزل" : "تأكيد الاستلام في المنزل",
                    subtitle: store.handoverConfirmedAt.map { Fmt.time($0) } ?? (r.hasArrived ? "بانتظار تأكيدك" : "بعد رحلة العودة")
                )
            }
            .card(padding: 8)
        }
    }

    private func confirmationRow(done: Bool, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: done ? "checkmark" : "clock")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(done ? Theme.greenDeep : Theme.muted)
                .frame(width: 44, height: 44)
                .background(done ? Theme.greenSoft : Theme.canvas, in: .rect(cornerRadius: 14))
                .overlay(alignment: .bottomTrailing) {
                    if done {
                        Circle().fill(Theme.green).frame(width: 9, height: 9)
                            .overlay(Circle().stroke(.white, lineWidth: 2))
                            .offset(x: 2, y: 2)
                    }
                }
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.plex(.subheadline, .bold)).foregroundStyle(done ? Theme.ink : Theme.muted)
                Text(subtitle).font(.plex(.caption)).foregroundStyle(Theme.muted)
            }
            Spacer()
            if done {
                Image(systemName: "checkmark.shield").foregroundStyle(Theme.gold)
            }
        }
        .padding(10)
        .animation(.smooth, value: done)
    }

    private var driverStrip: some View {
        let driver = store.student.driver
        return HStack(spacing: 12) {
            Image(systemName: "bus")
                .font(.system(size: 18))
                .foregroundStyle(Theme.ink)
                .frame(width: 44, height: 44)
                .background(.white, in: .circle)
            VStack(alignment: .leading, spacing: 1) {
                Text("السائق في الرحلة القادمة")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.ink)
                Text("\(driver.name) · \(driver.vehicle.plateNumber)")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
            Spacer()
            if let url = URL(string: "tel://\(driver.phone)") {
                Link(destination: url) {
                    Image(systemName: "phone")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 44, height: 44)
                        .background(.white, in: .circle)
                }
                .accessibilityLabel("الاتصال بالسائق")
            }
        }
        .padding(14)
        .background(Color(hex: 0xEAF0F5), in: .rect(cornerRadius: 22))
        .contentShape(.rect)
        .onTapGesture { store.open(.driver) }
    }

    private var helpStrip: some View {
        HStack {
            Label("تحتاج إلى مساعدة؟", systemImage: "bubble.left")
                .font(.plex(.subheadline, .medium))
                .foregroundStyle(Theme.ink)
            Spacer()
            Button {
                Haptics.tap()
                store.tab = .support
            } label: {
                Text("تواصل معنا")
                    .font(.plex(.footnote, .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 40)
                    .background(Theme.navyRaised, in: .rect(cornerRadius: 10))
            }
            .buttonStyle(PressableStyle())
        }
        .card(padding: 14, radius: 20)
    }
}

/// One trip ("رحلة الذهاب" / "رحلة العودة") as in designs 43 and 48.
struct TripCard: View {
    @Environment(FamilyStore.self) private var store
    let kind: TripKind

    var body: some View {
        let trip = store.trip(kind)
        let absent = store.isAbsent(on: kind)
        let state = cardState(trip, absent)
        Button {
            store.open(.liveTrip(kind))
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: state.symbol)
                        .font(.system(size: 24, weight: .regular))
                        .foregroundStyle(state.tint)
                        .frame(width: 52, height: 52)
                        .background(state.soft, in: .rect(cornerRadius: 16))
                    VStack(alignment: .leading, spacing: 0) {
                        Text(kind.title)
                            .font(.plex(.headline, .bold))
                            .foregroundStyle(Theme.ink)
                        HStack(alignment: .lastTextBaseline, spacing: 6) {
                            Text(Fmt.clock(trip.scheduledStart))
                                .font(.plex(size: 26, .bold, relativeTo: .title))
                                .foregroundStyle(Theme.ink)
                            Text(kind == .morning ? "صباحاً" : "ظهراً")
                                .font(.plex(.caption))
                                .foregroundStyle(Theme.muted)
                        }
                    }
                    Spacer()
                    StatusPill(title: state.pill, tint: state.tint, soft: state.soft)
                }

                Rectangle().fill(Theme.line).frame(height: 1)

                HStack(spacing: 6) {
                    Circle().fill(Theme.green).frame(width: 7, height: 7)
                    Text(kind.origin == "المنزل" ? "منزل العائلة" : store.student.school.name)
                    Image(systemName: "arrow.left").font(.caption2).foregroundStyle(Theme.muted.opacity(0.6))
                    Text(kind.destination == "المنزل" ? "منزل العائلة" : store.student.school.name)
                        .foregroundStyle(Theme.ink)
                    Spacer(minLength: 0)
                }
                .font(.plex(.caption, .medium))
                .foregroundStyle(Theme.muted)
                .lineLimit(1)

                HStack(spacing: 6) {
                    Image(systemName: state.footSymbol)
                    Text(state.foot)
                    Spacer(minLength: 0)
                    HStack(spacing: 2) {
                        Text("التفاصيل")
                        Image(systemName: "chevron.left").font(.caption2.weight(.semibold))
                    }
                    .foregroundStyle(Theme.muted)
                }
                .font(.plex(.caption))
                .foregroundStyle(state.footTint)
            }
            .padding(16)
            .background(state.highlight ? Theme.cream.opacity(0.6) : Theme.card, in: .rect(cornerRadius: 24))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(state.highlight ? Theme.goldLight.opacity(0.7) : .clear, lineWidth: 1))
            .shadow(color: Theme.navy.opacity(0.06), radius: 16, y: 6)
        }
        .buttonStyle(PressableStyle(scale: 0.98))
        .animation(.smooth, value: trip.status)
    }

    private struct CardState {
        var symbol: String
        var tint: Color
        var soft: Color
        var pill: String
        var foot: String
        var footSymbol: String
        var footTint: Color
        var highlight: Bool
    }

    private func cardState(_ trip: Trip, _ absent: Bool) -> CardState {
        if absent {
            return CardState(symbol: "calendar.badge.minus", tint: Theme.red, soft: Theme.redSoft, pill: "غياب", foot: "تم إبلاغ الإدارة والسائق بالغياب", footSymbol: "info.circle", footTint: Theme.red, highlight: false)
        }
        switch trip.status {
        case .arrivedAtSchool, .finished:
            let d = trip.eventDate(for: .arrivedAtSchool)
            return CardState(symbol: "checkmark.circle", tint: Theme.greenDeep, soft: Theme.greenSoft, pill: "وصلت بأمان",
                             foot: d.map { "تم تسجيل الوصول \(kind == .morning ? "عند بوابة المدرسة" : "إلى المنزل") · \(Fmt.time($0))" } ?? "اكتملت الرحلة",
                             footSymbol: "checkmark", footTint: Theme.muted, highlight: false)
        case .notStarted:
            return CardState(symbol: "clock", tint: Theme.gold, soft: Theme.goldSoft, pill: "مجدولة", foot: "سيصلك تنبيه عند اقتراب الحافلة", footSymbol: "bell", footTint: Theme.muted, highlight: kind == store.activeKind)
        default:
            return CardState(symbol: "location", tint: Theme.gold, soft: Theme.goldSoft, pill: "جارية الآن",
                             foot: trip.status.title(for: kind), footSymbol: "dot.radiowaves.left.and.right", footTint: Theme.gold, highlight: true)
        }
    }
}
