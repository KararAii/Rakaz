import SwiftUI

struct HomeView: View {
    @Environment(FamilyStore.self) private var store
    @Environment(SessionStore.self) private var session
    @State private var showAbsence: Bool = false

    var body: some View {
        BrandScreen(overlap: 96) {
            header
        } content: {
            StudentTripCard()
            if let absence = store.todaysAbsence {
                AbsenceTodayCard(absence: absence)
            }
            LiveRouteCard(onFollow: { store.open(.liveTrip(store.activeKind)) })
            TripStationsCard()
            quickActions
        }
        .sheet(isPresented: $showAbsence) {
            ReportAbsenceSheet().environment(store)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 18) {
            HeaderBar(
                leading: ("person", false, { store.tab = .family }),
                trailing: ("bell", store.unreadCount > 0, { store.showNotifications = true })
            ) {
                LogoBadge(height: 36)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("\(greeting)، \(session.account?.familyName ?? "عائلة أحمد")")
                    .font(.plex(.subheadline))
                    .foregroundStyle(.white.opacity(0.7))
                HStack(alignment: .lastTextBaseline) {
                    Text(Calendar.current.component(.hour, from: .now) < 12 ? "صباحك آمن" : "يومك آمن")
                        .font(.plex(size: 30, .bold, relativeTo: .largeTitle))
                        .foregroundStyle(.white)
                    Spacer()
                    Text(Fmt.dayDate(.now))
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.55))
                }
            }

            if store.students.count > 1 {
                StudentSwitcher(dark: true)
                    .padding(.horizontal, -20)
            }
        }
    }

    private var greeting: String {
        Calendar.current.component(.hour, from: .now) < 12 ? "صباح الخير" : "مساء الخير"
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(title: "اختصارات")
            HStack(spacing: 10) {
                QuickAction(symbol: "person.text.rectangle", title: "ملف الطالب", tint: Theme.ink, soft: Theme.blueSoft) {
                    store.open(.student(store.selectedStudentID))
                }
                QuickAction(symbol: "calendar.badge.minus", title: "إبلاغ غياب", tint: Theme.red, soft: Theme.redSoft) {
                    showAbsence = true
                }
                QuickAction(symbol: "graduationcap", title: "المدرسة", tint: Theme.greenDeep, soft: Theme.greenSoft) {
                    store.open(.school)
                }
                QuickAction(symbol: "creditcard", title: "الاشتراك", tint: Theme.gold, soft: Theme.goldSoft) {
                    store.open(.finance)
                }
            }
        }
    }
}

struct QuickAction: View {
    let symbol: String
    let title: String
    let tint: Color
    let soft: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                IconBadge(symbol: symbol, tint: tint, soft: soft, size: 44)
                Text(title)
                    .font(.plex(.caption, .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Theme.card, in: .rect(cornerRadius: 20))
            .shadow(color: Theme.navy.opacity(0.05), radius: 10, y: 4)
        }
        .buttonStyle(PressableStyle(scale: 0.94))
    }
}

/// Hero card from the design: child, live status pill, big ETA and the boarding confirmation strip.
struct StudentTripCard: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        let trip = store.activeTrip
        let student = store.student
        let absent = store.isAbsent(on: trip.kind)

        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                StudentAvatar(student: student, size: 48, verified: trip.isPickedUp && !absent)
                VStack(alignment: .leading, spacing: 1) {
                    Text(student.fullName.split(separator: " ").prefix(2).joined(separator: " "))
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                    Text("\(student.grade) \(student.stage.replacingOccurrences(of: "المرحلة ", with: ""))")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 4)
                if absent {
                    StatusPill(title: "غائب اليوم", tint: Theme.red, soft: Theme.redSoft)
                } else {
                    StatusPill(title: shortStatus(trip), tint: pillTint(trip), soft: pillSoft(trip), pulsing: trip.status.isMoving)
                        .contentTransition(.opacity)
                }
            }

            Rectangle().fill(Theme.line).frame(height: 1)

            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.etaTitle)
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                    HStack(alignment: .lastTextBaseline, spacing: 6) {
                        Text(Fmt.clock(store.etaDate))
                            .font(.plex(size: 36, .bold, relativeTo: .largeTitle))
                            .foregroundStyle(Theme.ink)
                            .contentTransition(.numericText())
                        Text(Fmt.period(store.etaDate))
                            .font(.plex(.footnote))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Spacer()
                if trip.status.isActive && !absent {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("متبقي")
                            .font(.plex(.caption))
                            .foregroundStyle(Theme.muted)
                        Text(Fmt.minutes(store.etaMinutes))
                            .font(.plex(.title3, .bold))
                            .foregroundStyle(Theme.gold)
                            .contentTransition(.numericText())
                    }
                    .padding(.bottom, 4)
                }
            }

            HStack(spacing: 8) {
                Image(systemName: confirmationSymbol(trip, absent))
                    .foregroundStyle(Theme.gold)
                Text(confirmationText(trip, absent))
                    .font(.plex(.caption, .medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Theme.canvas, in: .rect(cornerRadius: 14))
            .contentTransition(.opacity)
        }
        .card(padding: 18, radius: 26)
        .shadow(color: Theme.navy.opacity(0.08), radius: 24, y: 12)
        .animation(.smooth, value: trip.status)
    }

    private func shortStatus(_ trip: Trip) -> String {
        switch trip.status {
        case .notStarted: "مجدولة"
        case .preparing: "يستعد"
        case .driverOnTheWay: "السائق قادم"
        case .arrivedAtPickup: "عند الباب"
        case .studentPickedUp: "صعد بأمان"
        case .onTheWayToSchool: "في الطريق"
        case .arrivedAtSchool: trip.kind == .morning ? "وصل المدرسة" : "وصل المنزل"
        case .finished: "انتهت"
        }
    }

    private func pillTint(_ trip: Trip) -> Color {
        switch trip.status {
        case .notStarted, .preparing, .driverOnTheWay: Theme.gold
        case .arrivedAtPickup: Theme.red
        default: Theme.green
        }
    }

    private func pillSoft(_ trip: Trip) -> Color {
        switch trip.status {
        case .notStarted, .preparing, .driverOnTheWay: Theme.goldSoft
        case .arrivedAtPickup: Theme.redSoft
        default: Theme.greenSoft
        }
    }

    private func confirmationSymbol(_ trip: Trip, _ absent: Bool) -> String {
        if absent { return "calendar.badge.minus" }
        return trip.isPickedUp ? "checkmark.shield" : "clock"
    }

    private func confirmationText(_ trip: Trip, _ absent: Bool) -> String {
        let name = store.student.firstName
        if absent { return "تم إبلاغ الإدارة والسائق بغياب \(name) عن \(trip.kind.title)" }
        if trip.status >= .arrivedAtSchool, let d = trip.eventDate(for: .arrivedAtSchool) {
            return trip.kind == .morning ? "وصلت \(name) إلى المدرسة بأمان عند \(Fmt.clock(d))" : "وصلت \(name) إلى المنزل بأمان عند \(Fmt.clock(d))"
        }
        if trip.isPickedUp, let d = trip.eventDate(for: .studentPickedUp) {
            return "تم تسجيل صعود \(name) بأمان عند \(Fmt.clock(d))"
        }
        if trip.status == .arrivedAtPickup { return "السائق بانتظار \(name) الآن" }
        if trip.status == .driverOnTheWay { return "السائق \(store.student.driver.name) في الطريق إليكم" }
        return "تبدأ \(trip.kind.title) الساعة \(Fmt.time(trip.scheduledStart))"
    }
}

/// "الرحلة الصباحية مباشرة" card with a compact home → bus → school track.
struct LiveRouteCard: View {
    @Environment(FamilyStore.self) private var store
    let onFollow: () -> Void

    var body: some View {
        let trip = store.activeTrip
        let live = trip.status.isActive && !store.isAbsent(on: trip.kind)
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Circle()
                    .fill(live ? Theme.green : Theme.muted)
                    .frame(width: 8, height: 8)
                    .phaseAnimator([false, true]) { c, p in
                        c.scaleEffect(live && p ? 1.35 : 1).opacity(live && p ? 0.6 : 1)
                    } animation: { _ in .easeInOut(duration: 0.9) }
                Text(trip.kind == .morning ? "الرحلة الصباحية" : "رحلة العودة")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.ink)
                + Text(live ? " مباشرة" : "")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Text(live ? "تحديث الآن" : Fmt.relative(trip.updatedAt))
                    .font(.plex(.caption, .medium))
                    .foregroundStyle(Theme.gold)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)

            Rectangle().fill(Theme.line).frame(height: 1)

            RouteTrack(
                progress: store.overallProgress,
                origin: trip.kind == .morning ? "منزل \(store.student.firstName)" : shortSchool,
                destination: trip.kind == .morning ? shortSchool : "منزل \(store.student.firstName)",
                busLabel: "حافلة \(store.student.driver.vehicle.busNumber)"
            )
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.blueSoft, in: .rect(cornerRadius: 16))
            .padding(16)

            HStack {
                Label {
                    Text("السائق: ").foregroundStyle(Theme.muted) + Text(store.student.driver.name).foregroundStyle(Theme.ink).font(.plex(.caption, .bold))
                } icon: {
                    Image(systemName: "bus").foregroundStyle(Theme.ink)
                }
                .font(.plex(.caption))
                Spacer()
                Button(action: onFollow) {
                    HStack(spacing: 4) {
                        Text("متابعة الرحلة")
                        Image(systemName: "chevron.left").font(.caption2.weight(.bold))
                    }
                    .font(.plex(.footnote, .bold))
                    .foregroundStyle(Theme.gold)
                    .frame(minHeight: 44)
                    .contentShape(.rect)
                }
                .buttonStyle(PressableStyle())
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 6)
        }
        .background(Theme.card, in: .rect(cornerRadius: 24))
        .shadow(color: Theme.navy.opacity(0.06), radius: 16, y: 6)
    }

    private var shortSchool: String {
        store.student.school.name
    }
}

/// Horizontal origin → destination track (origin on the right for RTL) with a moving bus marker.
struct RouteTrack: View {
    let progress: Double
    let origin: String
    let destination: String
    var busLabel: String?

    var body: some View {
        VStack(spacing: 6) {
            if let busLabel {
                GeometryReader { geo in
                    let x = geo.size.width * (1 - clamped)
                    Text(busLabel)
                        .font(.plex(.caption2, .bold))
                        .foregroundStyle(Theme.ink)
                        .fixedSize()
                        .position(x: min(max(x, 34), geo.size.width - 34), y: 8)
                }
                .frame(height: 16)
                .environment(\.layoutDirection, .leftToRight)
            }
            GeometryReader { geo in
                let w = geo.size.width
                let x = w * (1 - clamped)
                ZStack {
                    Capsule().fill(Theme.muted.opacity(0.25)).frame(height: 2)
                    Capsule().fill(Theme.green.opacity(0.6))
                        .frame(width: max(0, w - x), height: 2)
                        .position(x: x + (w - x) / 2, y: 9)
                    Circle().fill(Theme.green).frame(width: 12, height: 12)
                        .overlay(Circle().stroke(.white, lineWidth: 2.5))
                        .position(x: w - 6, y: 9)
                    Circle().fill(Theme.navy).frame(width: 12, height: 12)
                        .overlay(Circle().stroke(.white, lineWidth: 2.5))
                        .position(x: 6, y: 9)
                    Circle().fill(Theme.gold).frame(width: 14, height: 14)
                        .overlay(Circle().stroke(.white, lineWidth: 3))
                        .shadow(color: Theme.gold.opacity(0.5), radius: 4)
                        .position(x: min(max(x, 7), w - 7), y: 9)
                }
            }
            .frame(height: 18)
            .environment(\.layoutDirection, .leftToRight)

            HStack {
                Text(origin)
                Spacer()
                Text(destination)
            }
            .font(.plex(.caption2, .medium))
            .foregroundStyle(Theme.muted)
            .lineLimit(1)
        }
        .animation(.linear(duration: 0.95), value: progress)
    }

    private var clamped: Double { min(max(progress, 0), 1) }
}

struct AbsenceTodayCard: View {
    @Environment(FamilyStore.self) private var store
    let absence: Absence

    var body: some View {
        HStack(spacing: 12) {
            IconBadge(symbol: "calendar.badge.minus", tint: Theme.red, soft: .white, size: 42)
            VStack(alignment: .leading, spacing: 3) {
                Text("تم الإبلاغ عن غياب \(store.student.firstName) · \(absence.scope.title)")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.ink)
                HStack(spacing: 10) {
                    seen("الإدارة", absence.seenByAdmin)
                    seen("السائق", absence.seenByDriver)
                }
            }
            Spacer(minLength: 0)
            Button("إلغاء") {
                Haptics.tap()
                store.cancelAbsence(absence.id)
            }
            .font(.plex(.footnote, .semibold))
            .foregroundStyle(Theme.red)
        }
        .padding(14)
        .background(Theme.redSoft, in: .rect(cornerRadius: 20))
        .transition(.scale(scale: 0.95).combined(with: .opacity))
    }

    private func seen(_ who: String, _ ok: Bool) -> some View {
        HStack(spacing: 3) {
            Image(systemName: ok ? "checkmark.circle.fill" : "clock")
            Text(ok ? "اطّلع \(who)" : "بانتظار \(who)")
        }
        .font(.plex(.caption))
        .foregroundStyle(ok ? Theme.green : Theme.muted)
        .contentTransition(.opacity)
    }
}

/// "محطات رحلة ليان": the key milestones of the active trip, with the full 8-state list on demand.
struct TripStationsCard: View {
    @Environment(FamilyStore.self) private var store
    var kind: TripKind?
    @State private var expanded: Bool = false

    var body: some View {
        let trip = store.trip(kind ?? store.activeKind)
        let statuses = expanded
            ? TripStatus.allCases.filter { $0 != .notStarted }
            : [TripStatus.studentPickedUp, .onTheWayToSchool, .arrivedAtSchool]

        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("محطات رحلة \(store.student.firstName)")
                    .font(.plex(.headline, .bold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Button {
                    Haptics.tap()
                    withAnimation(.snappy) { expanded.toggle() }
                } label: {
                    Text(expanded ? "عرض أقل" : trip.kind.title)
                        .font(.plex(.caption, .medium))
                        .foregroundStyle(expanded ? Theme.gold : Theme.muted)
                        .frame(minHeight: 32)
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(statuses.enumerated()), id: \.element) { index, status in
                    TimelineRow(
                        title: stationTitle(status, trip),
                        subtitle: stationSubtitle(status, trip),
                        state: state(of: status, in: trip),
                        isLast: index == statuses.count - 1
                    )
                }
            }

            if !expanded {
                Button {
                    Haptics.tap()
                    withAnimation(.snappy) { expanded = true }
                } label: {
                    Text("كل حالات الرحلة (٨)")
                        .font(.plex(.caption, .semibold))
                        .foregroundStyle(Theme.gold)
                        .frame(maxWidth: .infinity, minHeight: 36)
                }
            }
        }
        .card(padding: 18)
        .animation(.smooth, value: trip.status)
    }

    private func state(of status: TripStatus, in trip: Trip) -> TimelineRow.State {
        if store.isAbsent(on: trip.kind) { return .pending }
        if status < trip.status || (status == trip.status && (status == .finished || status == .studentPickedUp || status == .arrivedAtSchool)) {
            return .done
        }
        if status == trip.status { return .current }
        if !expanded && status == .onTheWayToSchool && trip.status < .onTheWayToSchool && trip.status > .notStarted { return .pending }
        return .pending
    }

    private func stationTitle(_ status: TripStatus, _ trip: Trip) -> String {
        guard !expanded else { return status.title(for: trip.kind) }
        switch status {
        case .studentPickedUp: return "تم الصعود"
        case .onTheWayToSchool: return "في الطريق"
        case .arrivedAtSchool: return trip.kind == .morning ? "الوصول للمدرسة" : "الوصول للمنزل"
        default: return status.title(for: trip.kind)
        }
    }

    private func stationSubtitle(_ status: TripStatus, _ trip: Trip) -> String? {
        let date = trip.eventDate(for: status)
        switch status {
        case .studentPickedUp:
            let place = trip.kind == .morning ? "منزل \(store.student.firstName)" : "بوابة المدرسة"
            return date.map { "\(place) · \(Fmt.clock($0))" } ?? place
        case .onTheWayToSchool:
            if trip.status == .onTheWayToSchool { return "\(store.student.address.neighborhood) · الآن" }
            return date.map { Fmt.time($0) }
        case .arrivedAtSchool:
            return date.map { Fmt.time($0) } ?? "متوقع \(Fmt.clock(store.etaDate(trip.kind)))"
        default:
            return date.map { Fmt.time($0) } ?? (status == trip.status ? "الآن" : nil)
        }
    }
}

struct TimelineRow: View {
    enum State { case done, current, pending }

    let title: String
    let subtitle: String?
    let state: State
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .stroke(ringColor, lineWidth: 2)
                        .frame(width: 20, height: 20)
                    Circle()
                        .fill(dotColor)
                        .frame(width: 10, height: 10)
                }
                .frame(width: 22, height: 22)
                .background(state == .pending ? .clear : ringColor.opacity(0.15), in: .circle)
                if !isLast {
                    DashedLine()
                        .stroke(Theme.muted.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [3, 3]))
                        .frame(width: 2)
                        .frame(minHeight: 30)
                }
            }
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.plex(.subheadline, .bold))
                        .foregroundStyle(state == .pending ? Theme.muted.opacity(0.7) : Theme.ink)
                    if let subtitle {
                        Text(subtitle)
                            .font(.plex(.caption))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Spacer()
                switch state {
                case .done:
                    Image(systemName: "checkmark")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.green)
                case .current:
                    Text("جارية")
                        .font(.plex(.caption, .bold))
                        .foregroundStyle(Theme.gold)
                case .pending:
                    EmptyView()
                }
            }
            .padding(.bottom, isLast ? 0 : 14)
        }
    }

    private var ringColor: Color {
        switch state {
        case .done: Theme.green
        case .current: Theme.gold
        case .pending: Theme.line
        }
    }

    private var dotColor: Color {
        switch state {
        case .done: Theme.green
        case .current: Theme.gold
        case .pending: Theme.line
        }
    }
}

struct DashedLine: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY + 2))
        p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY - 2))
        return p
    }
}
