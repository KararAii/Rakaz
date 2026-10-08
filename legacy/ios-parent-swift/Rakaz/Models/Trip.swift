import Foundation

nonisolated struct TripEvent: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    let status: TripStatus
    let date: Date
    let note: String
}

nonisolated struct Trip: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let kind: TripKind
    var status: TripStatus
    var scheduledStart: Date
    var expectedArrival: Date
    var progress: Double
    var distanceKm: Double
    var speedKmh: Int
    var events: [TripEvent]
    var updatedAt: Date

    var minutesRemaining: Int {
        max(0, Int((expectedArrival.timeIntervalSinceNow / 60.0).rounded(.up)))
    }

    var isPickedUp: Bool { status >= .studentPickedUp }
    var hasArrived: Bool { status >= .arrivedAtSchool }

    func eventDate(for status: TripStatus) -> Date? {
        events.last(where: { $0.status == status })?.date
    }
}
