import Foundation

nonisolated enum TicketKind: String, Codable, Sendable {
    case complaint
    case feedback

    var title: String { self == .complaint ? "شكوى" : "ملاحظة" }
}

nonisolated enum TicketTopic: String, Codable, Sendable, CaseIterable {
    case driver, timing, vehicle, payment, app, other

    var title: String {
        switch self {
        case .driver: "السائق"
        case .timing: "المواعيد"
        case .vehicle: "المركبة"
        case .payment: "الدفع"
        case .app: "التطبيق"
        case .other: "أخرى"
        }
    }
}

nonisolated struct SupportTicket: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let kind: TicketKind
    let topic: TicketTopic
    let body: String
    let createdAt: Date
    var status: String
}

nonisolated struct FAQItem: Identifiable, Sendable, Hashable {
    let id: Int
    let question: String
    let answer: String
}
