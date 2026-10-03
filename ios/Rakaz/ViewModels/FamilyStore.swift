import SwiftUI
import CoreLocation

nonisolated enum AppTab: Hashable, CaseIterable {
    case home, trips, family, support

    var title: String {
        switch self {
        case .home: "الرئيسية"
        case .trips: "الرحلات"
        case .family: "العائلة"
        case .support: "المساعدة"
        }
    }

    var symbol: String {
        switch self {
        case .home: "house"
        case .trips: "clock"
        case .family: "person.2"
        case .support: "bubble.left"
        }
    }
}

/// Central guardian-side state: children, live trips, notifications, absences, finance and support.
/// Trip updates are simulated locally until the Rakaz realtime backend is connected.
@Observable
final class FamilyStore {
    private enum Keys {
        static let absences = "rakaz.absences"
        static let tickets = "rakaz.tickets"
        static let prefs = "rakaz.notificationPrefs"
        static let addresses = "rakaz.addresses"
    }

    var tab: AppTab = .home
    var students: [Student]
    var selectedStudentID: String
    var morningTrip: Trip
    var returnTrip: Trip
    var activeKind: TripKind = .morning
    var notifications: [AppNotification]
    var absences: [Absence]
    var tickets: [SupportTicket]
    var preferences: NotificationPreferences {
        didSet { Storage.save(preferences, key: Keys.prefs) }
    }
    var banner: AppNotification?
    var showNotifications: Bool = false

    var homePath: NavigationPath = NavigationPath()
    var tripsPath: NavigationPath = NavigationPath()
    var familyPath: NavigationPath = NavigationPath()
    var supportPath: NavigationPath = NavigationPath()

    /// Raised when the return trip drops the student home; the guardian confirms the handover.
    var handoverPending: Bool = false
    var handoverConfirmedAt: Date?

    private var holdTicks: Int = 0
    private var didNotifyNear: Bool = false
    private var simulation: Task<Void, Never>?
    private var bannerTask: Task<Void, Never>?

    init() {
        var students = MockData.students
        if let saved = Storage.load([String: StudentAddress].self, key: Keys.addresses) {
            for i in students.indices {
                if let addr = saved[students[i].id] { students[i].address = addr }
            }
        }
        self.students = students
        self.selectedStudentID = students.first?.id ?? ""
        self.notifications = MockData.notifications()
        self.absences = Storage.load([Absence].self, key: Keys.absences) ?? []
        self.tickets = Storage.load([SupportTicket].self, key: Keys.tickets) ?? []
        self.preferences = Storage.load(NotificationPreferences.self, key: Keys.prefs) ?? NotificationPreferences()
        let (morning, ret) = Self.makeInitialTrips()
        self.morningTrip = morning
        self.returnTrip = ret
    }

    // MARK: - Navigation

    var isTabBarHidden: Bool {
        switch tab {
        case .home: !homePath.isEmpty
        case .trips: !tripsPath.isEmpty
        case .family: !familyPath.isEmpty
        case .support: !supportPath.isEmpty
        }
    }

    /// Pushes a route onto the currently selected tab's stack.
    func open(_ route: Route) {
        Haptics.tap()
        switch tab {
        case .home: homePath.append(route)
        case .trips: tripsPath.append(route)
        case .family: familyPath.append(route)
        case .support: supportPath.append(route)
        }
    }

    func popToRoot(_ tab: AppTab) {
        switch tab {
        case .home: homePath = NavigationPath()
        case .trips: tripsPath = NavigationPath()
        case .family: familyPath = NavigationPath()
        case .support: supportPath = NavigationPath()
        }
    }

    // MARK: - Derived

    var student: Student {
        students.first(where: { $0.id == selectedStudentID }) ?? students[0]
    }

    var activeTrip: Trip { trip(activeKind) }

    func trip(_ kind: TripKind) -> Trip {
        kind == .morning ? morningTrip : returnTrip
    }

    var unreadCount: Int { notifications.filter { !$0.isRead }.count }

    var subscription: Subscription { MockData.subscription(for: selectedStudentID) }

    var payments: [Payment] { MockData.payments(for: selectedStudentID) }

    func subscription(for id: String) -> Subscription { MockData.subscription(for: id) }

    var todaysAbsence: Absence? {
        absences.first { $0.studentID == selectedStudentID && Calendar.current.isDateInToday($0.day) }
    }

    func isAbsent(on kind: TripKind) -> Bool {
        guard let a = todaysAbsence else { return false }
        switch a.scope {
        case .fullDay: return true
        case .morningOnly: return kind == .morning
        case .returnOnly: return kind == .afternoon
        }
    }

    var homeCoordinate: CLLocationCoordinate2D { student.address.coordinate }
    var schoolCoordinate: CLLocationCoordinate2D { student.school.coordinate }

    /// First leg: bus heading to the pickup point. Second leg: carrying the student.
    func legs(for kind: TripKind) -> (first: [CLLocationCoordinate2D], second: [CLLocationCoordinate2D]) {
        let toHome = RouteGeometry.toHome(home: homeCoordinate)
        let toSchool = RouteGeometry.toSchool(home: homeCoordinate, school: schoolCoordinate)
        if kind == .morning { return (toHome, toSchool) }
        return (toHome + toSchool.dropFirst(), toSchool.reversed())
    }

    func pickupCoordinate(_ kind: TripKind) -> CLLocationCoordinate2D {
        kind == .morning ? homeCoordinate : schoolCoordinate
    }

    func dropoffCoordinate(_ kind: TripKind) -> CLLocationCoordinate2D {
        kind == .morning ? schoolCoordinate : homeCoordinate
    }

    var vehicleCoordinate: CLLocationCoordinate2D { vehicleCoordinate(activeKind) }

    func vehicleCoordinate(_ kind: TripKind) -> CLLocationCoordinate2D {
        let trip = trip(kind)
        let legs = legs(for: kind)
        switch trip.status {
        case .notStarted, .preparing: return RouteGeometry.depot
        case .driverOnTheWay: return RouteGeometry.point(on: legs.first, at: trip.progress)
        case .arrivedAtPickup, .studentPickedUp: return legs.second.first ?? pickupCoordinate(kind)
        case .onTheWayToSchool: return RouteGeometry.point(on: legs.second, at: trip.progress)
        case .arrivedAtSchool, .finished: return legs.second.last ?? dropoffCoordinate(kind)
        }
    }

    private static let firstLegMinutes: Double = 12
    private static let secondLegMinutes: Double = 18

    /// Minutes until the next milestone (pickup before boarding, destination after).
    var etaMinutes: Int { etaMinutes(activeKind) }

    func etaMinutes(_ kind: TripKind) -> Int {
        let trip = trip(kind)
        switch trip.status {
        case .notStarted:
            return max(0, Int(trip.scheduledStart.timeIntervalSinceNow / 60) + Int(Self.firstLegMinutes))
        case .preparing: return Int(Self.firstLegMinutes) + 3
        case .driverOnTheWay: return max(1, Int(((1 - trip.progress) * Self.firstLegMinutes).rounded(.up)))
        case .arrivedAtPickup, .studentPickedUp: return Int(Self.secondLegMinutes)
        case .onTheWayToSchool: return max(1, Int(((1 - trip.progress) * Self.secondLegMinutes).rounded(.up)))
        case .arrivedAtSchool, .finished: return 0
        }
    }

    var etaDate: Date { etaDate(activeKind) }

    func etaDate(_ kind: TripKind) -> Date {
        let trip = trip(kind)
        if trip.status >= .arrivedAtSchool { return trip.eventDate(for: .arrivedAtSchool) ?? trip.expectedArrival }
        if trip.status == .notStarted { return trip.expectedArrival }
        return Date.now.addingTimeInterval(Double(etaMinutes(kind)) * 60)
    }

    var etaTitle: String { etaTitle(activeKind) }

    func etaTitle(_ kind: TripKind) -> String {
        let trip = trip(kind)
        if trip.status == .notStarted {
            return trip.kind == .morning ? "الوصول المتوقع للمدرسة" : "الوصول المتوقع للمنزل"
        }
        if trip.status < .arrivedAtPickup {
            return trip.kind == .morning ? "وصول السائق إلى المنزل" : "وصول السائق إلى المدرسة"
        }
        if trip.status >= .arrivedAtSchool { return trip.kind == .morning ? "وصل إلى المدرسة" : "وصل إلى المنزل" }
        return trip.kind == .morning ? "الوصول المتوقع للمدرسة" : "الوصول المتوقع للمنزل"
    }

    /// 0...1 progress across the whole trip (both legs).
    var overallProgress: Double { overallProgress(activeKind) }

    func overallProgress(_ kind: TripKind) -> Double {
        let trip = trip(kind)
        switch trip.status {
        case .notStarted: return 0
        case .preparing: return 0.04
        case .driverOnTheWay: return 0.05 + trip.progress * 0.35
        case .arrivedAtPickup: return 0.42
        case .studentPickedUp: return 0.46
        case .onTheWayToSchool: return 0.48 + trip.progress * 0.5
        case .arrivedAtSchool, .finished: return 1
        }
    }

    var remainingDistanceKm: Double { remainingDistanceKm(activeKind) }

    func remainingDistanceKm(_ kind: TripKind) -> Double {
        let trip = trip(kind)
        let legs = legs(for: trip.kind)
        let l1 = RouteGeometry.length(of: legs.first) / 1000
        let l2 = RouteGeometry.length(of: legs.second) / 1000
        switch trip.status {
        case .notStarted, .preparing: return l1 + l2
        case .driverOnTheWay: return l1 * (1 - trip.progress) + l2
        case .arrivedAtPickup, .studentPickedUp: return l2
        case .onTheWayToSchool: return l2 * (1 - trip.progress)
        case .arrivedAtSchool, .finished: return 0
        }
    }

    // MARK: - Selection

    func select(student id: String) {
        guard id != selectedStudentID else { return }
        Haptics.selection()
        withAnimation(.snappy) { selectedStudentID = id }
    }

    // MARK: - Simulation

    func startSimulation() {
        guard simulation == nil else { return }
        simulation = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                self?.tick()
            }
        }
    }

    func restartDemo() {
        let (morning, ret) = Self.makeInitialTrips()
        withAnimation(.smooth) {
            morningTrip = morning
            returnTrip = ret
            activeKind = .morning
        }
        holdTicks = 0
        didNotifyNear = false
        handoverPending = false
        handoverConfirmedAt = nil
        Haptics.success()
    }

    func confirmHandover() {
        handoverConfirmedAt = .now
        Haptics.success()
    }

    /// Guardian says the student has not arrived: hand off to support and alert the operations team.
    func reportHandoverIssue() {
        handoverPending = false
        tab = .support
        submitTicket(kind: .complaint, topic: .timing, body: "لم يصل \(student.firstName) إلى المنزل رغم تسجيل الوصول في رحلة العودة.")
    }

    private func tick() {
        var trip = activeTrip
        if isAbsent(on: trip.kind) {
            if activeKind == .morning && morningTrip.status == .finished && !isAbsent(on: .afternoon) {
                activeKind = .afternoon
            }
            return
        }
        trip.updatedAt = .now
        switch trip.status {
        case .notStarted:
            if trip.kind == .afternoon { advance(&trip) }
        case .preparing:
            holdTicks += 1
            if holdTicks >= 5 { advance(&trip) }
        case .driverOnTheWay, .onTheWayToSchool:
            trip.progress = min(1, trip.progress + 0.022)
            trip.speedKmh = Int.random(in: 28...44)
            if trip.status == .driverOnTheWay, trip.progress > 0.78, !didNotifyNear, trip.kind == .morning {
                didNotifyNear = true
                push(.driverNear, "السائق على بُعد دقائق من المنزل. يُرجى تجهيز \(student.firstName).")
            }
            if trip.progress >= 1 { advance(&trip) }
        case .arrivedAtPickup, .studentPickedUp:
            holdTicks += 1
            if holdTicks >= 5 { advance(&trip) }
        case .arrivedAtSchool:
            holdTicks += 1
            if holdTicks >= 6 { advance(&trip) }
        case .finished:
            holdTicks += 1
            if trip.kind == .morning, holdTicks >= 8 {
                holdTicks = 0
                withAnimation(.smooth) { activeKind = .afternoon }
                return
            }
        }
        withAnimation(.linear(duration: 0.95)) { set(trip) }
    }

    private func advance(_ trip: inout Trip) {
        guard let next = trip.status.next else { return }
        holdTicks = 0
        trip.status = next
        trip.progress = 0
        trip.speedKmh = next.isMoving ? 32 : 0
        trip.events.append(TripEvent(id: UUID(), status: next, date: .now, note: ""))
        if next == .finished || next == .arrivedAtSchool {
            trip.expectedArrival = trip.eventDate(for: .arrivedAtSchool) ?? .now
        }
        Haptics.soft()
        notify(for: next, kind: trip.kind)
        if next == .arrivedAtSchool && trip.kind == .afternoon {
            handoverConfirmedAt = nil
            handoverPending = true
        }
    }

    private func notify(for status: TripStatus, kind: TripKind) {
        let name = student.firstName
        switch (status, kind) {
        case (.driverOnTheWay, .morning): push(.tripStarted, "بدأ السائق \(student.driver.name) رحلة الصباح وهو في الطريق إليكم.")
        case (.studentPickedUp, .morning): push(.pickedUp, "تم استلام \(name) بأمان الساعة \(Fmt.time(.now)).")
        case (.arrivedAtSchool, .morning): push(.arrivedSchool, "وصلت \(name) إلى \(student.school.name) الساعة \(Fmt.time(.now)).")
        case (.onTheWayToSchool, .afternoon): push(.returnStarted, "انطلقت رحلة العودة. \(name) في الطريق إلى المنزل.")
        case (.arrivedAtSchool, .afternoon): push(.delivered, "تم تسليم \(name) إلى المنزل بأمان الساعة \(Fmt.time(.now)).")
        default: break
        }
    }

    private func set(_ trip: Trip) {
        if trip.kind == .morning { morningTrip = trip } else { returnTrip = trip }
    }

    // MARK: - Notifications

    func push(_ kind: NotificationKind, _ body: String) {
        guard preferences.isOn(kind) else { return }
        let n = AppNotification(id: UUID(), kind: kind, body: body, date: .now, isRead: false)
        withAnimation(.snappy) { notifications.insert(n, at: 0) }
        NotificationService.post(title: kind.title, body: body)
        showBanner(n)
    }

    private func showBanner(_ n: AppNotification) {
        bannerTask?.cancel()
        withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) { banner = n }
        bannerTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(3.5))
            guard !Task.isCancelled else { return }
            withAnimation(.smooth) { self?.banner = nil }
        }
    }

    func dismissBanner() {
        withAnimation(.smooth) { banner = nil }
    }

    func markRead(_ id: UUID) {
        guard let i = notifications.firstIndex(where: { $0.id == id }) else { return }
        notifications[i].isRead = true
    }

    func markAllRead() {
        withAnimation(.snappy) {
            for i in notifications.indices { notifications[i].isRead = true }
        }
    }

    func deleteNotification(_ id: UUID) {
        withAnimation(.snappy) { notifications.removeAll { $0.id == id } }
    }

    // MARK: - Absence

    func reportAbsence(day: Date, scope: AbsenceScope, reason: AbsenceReason, note: String) {
        let absence = Absence(
            id: UUID(), studentID: selectedStudentID,
            day: Calendar.current.startOfDay(for: day), scope: scope, reason: reason,
            note: note.trimmingCharacters(in: .whitespacesAndNewlines),
            createdAt: .now, seenByAdmin: false, seenByDriver: false
        )
        absences.removeAll { $0.studentID == absence.studentID && Calendar.current.isDate($0.day, inSameDayAs: absence.day) }
        absences.insert(absence, at: 0)
        absences.sort { $0.day > $1.day }
        Storage.save(absences, key: Keys.absences)
        Haptics.success()
        let id = absence.id
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(3))
            self?.markAbsenceSeen(id)
        }
    }

    private func markAbsenceSeen(_ id: UUID) {
        guard let i = absences.firstIndex(where: { $0.id == id }) else { return }
        withAnimation(.snappy) {
            absences[i].seenByAdmin = true
            absences[i].seenByDriver = true
        }
        Storage.save(absences, key: Keys.absences)
    }

    func cancelAbsence(_ id: UUID) {
        withAnimation(.snappy) { absences.removeAll { $0.id == id } }
        Storage.save(absences, key: Keys.absences)
    }

    func absences(for studentID: String) -> [Absence] {
        absences.filter { $0.studentID == studentID }
    }

    // MARK: - Address

    func updateAddress(_ address: StudentAddress, for studentID: String) {
        guard let i = students.firstIndex(where: { $0.id == studentID }) else { return }
        students[i].address = address
        let map = Dictionary(uniqueKeysWithValues: students.map { ($0.id, $0.address) })
        Storage.save(map, key: Keys.addresses)
        Haptics.success()
    }

    // MARK: - Support

    func submitTicket(kind: TicketKind, topic: TicketTopic, body: String) {
        let number = Int.random(in: 1000...9999)
        let ticket = SupportTicket(id: "#\(number)", kind: kind, topic: topic, body: body, createdAt: .now, status: "قيد المراجعة")
        tickets.insert(ticket, at: 0)
        Storage.save(tickets, key: Keys.tickets)
        Haptics.success()
    }

    // MARK: - Seed

    private static func makeInitialTrips() -> (Trip, Trip) {
        let now = Date.now
        let morning = Trip(
            id: "TRIP-AM",
            kind: .morning,
            status: .driverOnTheWay,
            scheduledStart: now.addingTimeInterval(-60 * 6),
            expectedArrival: now.addingTimeInterval(60 * 8),
            progress: 0.32,
            distanceKm: 3.2,
            speedKmh: 34,
            events: [
                TripEvent(id: UUID(), status: .notStarted, date: now.addingTimeInterval(-60 * 30), note: ""),
                TripEvent(id: UUID(), status: .preparing, date: now.addingTimeInterval(-60 * 9), note: ""),
                TripEvent(id: UUID(), status: .driverOnTheWay, date: now.addingTimeInterval(-60 * 5), note: "")
            ],
            updatedAt: now
        )
        let start = Calendar.current.date(bySettingHour: 13, minute: 15, second: 0, of: now) ?? now
        let ret = Trip(
            id: "TRIP-PM",
            kind: .afternoon,
            status: .notStarted,
            scheduledStart: start,
            expectedArrival: start.addingTimeInterval(60 * 30),
            progress: 0,
            distanceKm: 4.6,
            speedKmh: 0,
            events: [],
            updatedAt: now
        )
        return (morning, ret)
    }
}
