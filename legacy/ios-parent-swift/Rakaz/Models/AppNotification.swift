import SwiftUI

nonisolated enum NotificationKind: String, Codable, Sendable, CaseIterable {
    case tripReminder
    case tripStarted
    case driverNear
    case pickedUp
    case arrivedSchool
    case returnStarted
    case delivered
    case payment
    case delay
    case admin

    var title: String {
        switch self {
        case .tripReminder: "تذكير بموعد الرحلة"
        case .tripStarted: "السائق بدأ الرحلة"
        case .driverNear: "السائق قريب من المنزل"
        case .pickedUp: "تم استلام الطالب"
        case .arrivedSchool: "الطالب وصل إلى المدرسة"
        case .returnStarted: "بدأت رحلة العودة"
        case .delivered: "الطالب تم تسليمه"
        case .payment: "إشعار دفع"
        case .delay: "إشعار تأخر"
        case .admin: "إشعار من الإدارة"
        }
    }

    var symbol: String {
        switch self {
        case .tripReminder: "alarm.fill"
        case .tripStarted: "bus.fill"
        case .driverNear: "location.circle.fill"
        case .pickedUp: "person.fill.checkmark"
        case .arrivedSchool: "building.columns.fill"
        case .returnStarted: "arrow.uturn.backward.circle.fill"
        case .delivered: "house.fill"
        case .payment: "creditcard.fill"
        case .delay: "exclamationmark.triangle.fill"
        case .admin: "megaphone.fill"
        }
    }

    var tint: Color {
        switch self {
        case .tripReminder, .tripStarted, .returnStarted: Theme.blue
        case .driverNear: Theme.gold
        case .pickedUp, .arrivedSchool, .delivered: Theme.green
        case .payment: Theme.teal
        case .delay: Theme.red
        case .admin: Theme.navy
        }
    }

    var category: NotificationCategory {
        switch self {
        case .payment: .finance
        case .admin, .delay: .admin
        default: .trips
        }
    }
}

nonisolated enum NotificationCategory: String, CaseIterable, Sendable {
    case all, trips, finance, admin

    var title: String {
        switch self {
        case .all: "الكل"
        case .trips: "الرحلات"
        case .finance: "المالية"
        case .admin: "الإدارة"
        }
    }
}

nonisolated struct AppNotification: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    let kind: NotificationKind
    let body: String
    let date: Date
    var isRead: Bool
}

/// User opt-in per push-notification type.
nonisolated struct NotificationPreferences: Codable, Sendable, Hashable {
    var enabled: [String: Bool] = Dictionary(uniqueKeysWithValues: NotificationKind.allCases.map { ($0.rawValue, true) })

    func isOn(_ kind: NotificationKind) -> Bool { enabled[kind.rawValue] ?? true }
}
