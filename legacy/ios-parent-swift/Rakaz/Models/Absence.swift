import Foundation

nonisolated enum AbsenceReason: String, Codable, Sendable, CaseIterable {
    case none
    case sick
    case family
    case travel
    case appointment
    case other

    var title: String {
        switch self {
        case .none: "بدون سبب"
        case .sick: "مرض"
        case .family: "ظرف عائلي"
        case .travel: "سفر"
        case .appointment: "موعد طبي"
        case .other: "سبب آخر"
        }
    }

    var symbol: String {
        switch self {
        case .none: "minus.circle"
        case .sick: "cross.case.fill"
        case .family: "figure.2.and.child.holdinghands"
        case .travel: "airplane"
        case .appointment: "stethoscope"
        case .other: "ellipsis.circle"
        }
    }
}

nonisolated enum AbsenceScope: String, Codable, Sendable, CaseIterable {
    case fullDay
    case morningOnly
    case returnOnly

    var title: String {
        switch self {
        case .fullDay: "اليوم كاملاً"
        case .morningOnly: "الذهاب فقط"
        case .returnOnly: "العودة فقط"
        }
    }
}

nonisolated struct Absence: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    let studentID: String
    var day: Date
    var scope: AbsenceScope
    var reason: AbsenceReason
    var note: String
    let createdAt: Date
    var seenByAdmin: Bool
    var seenByDriver: Bool
}
