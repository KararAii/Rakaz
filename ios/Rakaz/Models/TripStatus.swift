import SwiftUI

/// The eight lifecycle states of a trip, in order.
nonisolated enum TripStatus: Int, Codable, Sendable, CaseIterable, Comparable {
    case notStarted = 0
    case preparing
    case driverOnTheWay
    case arrivedAtPickup
    case studentPickedUp
    case onTheWayToSchool
    case arrivedAtSchool
    case finished

    static func < (lhs: TripStatus, rhs: TripStatus) -> Bool { lhs.rawValue < rhs.rawValue }

    func title(for kind: TripKind) -> String {
        switch (self, kind) {
        case (.notStarted, _): "لم تبدأ"
        case (.preparing, _): "السائق يستعد"
        case (.driverOnTheWay, .morning): "السائق في الطريق"
        case (.driverOnTheWay, .afternoon): "السائق في الطريق للمدرسة"
        case (.arrivedAtPickup, .morning): "وصل إلى نقطة الطالب"
        case (.arrivedAtPickup, .afternoon): "وصل إلى المدرسة"
        case (.studentPickedUp, _): "تم استلام الطالب"
        case (.onTheWayToSchool, .morning): "في الطريق إلى المدرسة"
        case (.onTheWayToSchool, .afternoon): "في الطريق إلى المنزل"
        case (.arrivedAtSchool, .morning): "وصل إلى المدرسة"
        case (.arrivedAtSchool, .afternoon): "تم تسليم الطالب"
        case (.finished, _): "انتهت الرحلة"
        }
    }

    var symbol: String {
        switch self {
        case .notStarted: "clock"
        case .preparing: "wrench.and.screwdriver"
        case .driverOnTheWay: "bus.fill"
        case .arrivedAtPickup: "mappin.and.ellipse"
        case .studentPickedUp: "person.fill.checkmark"
        case .onTheWayToSchool: "arrow.triangle.turn.up.right.diamond.fill"
        case .arrivedAtSchool: "building.columns.fill"
        case .finished: "flag.checkered"
        }
    }

    var tint: Color {
        switch self {
        case .notStarted: Theme.muted
        case .preparing: Theme.blue
        case .driverOnTheWay, .onTheWayToSchool: Theme.gold
        case .arrivedAtPickup: Theme.red
        case .studentPickedUp, .arrivedAtSchool, .finished: Theme.green
        }
    }

    var softTint: Color {
        switch self {
        case .notStarted, .preparing: Theme.blueSoft
        case .driverOnTheWay, .onTheWayToSchool: Theme.goldSoft
        case .arrivedAtPickup: Theme.redSoft
        case .studentPickedUp, .arrivedAtSchool, .finished: Theme.greenSoft
        }
    }

    var isMoving: Bool {
        self == .driverOnTheWay || self == .onTheWayToSchool
    }

    var isActive: Bool {
        self > .notStarted && self < .finished
    }

    var next: TripStatus? {
        TripStatus(rawValue: rawValue + 1)
    }
}

nonisolated enum TripKind: String, Codable, Sendable {
    case morning
    case afternoon

    var title: String { self == .morning ? "رحلة الذهاب" : "رحلة العودة" }
    var shortTitle: String { self == .morning ? "رحلة الصباح" : "رحلة العودة" }
    var origin: String { self == .morning ? "المنزل" : "المدرسة" }
    var destination: String { self == .morning ? "المدرسة" : "المنزل" }
}
