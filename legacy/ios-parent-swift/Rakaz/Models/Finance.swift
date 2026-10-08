import SwiftUI

nonisolated enum AccountStatus: String, Codable, Sendable {
    case paid
    case partiallyPaid
    case overdue
    case unpaid

    var title: String {
        switch self {
        case .paid: "مدفوع"
        case .partiallyPaid: "مدفوع جزئياً"
        case .overdue: "متأخر"
        case .unpaid: "غير مدفوع"
        }
    }

    var tint: Color {
        switch self {
        case .paid: Theme.green
        case .partiallyPaid: Theme.gold
        case .overdue: Theme.red
        case .unpaid: Theme.muted
        }
    }

    var soft: Color {
        switch self {
        case .paid: Theme.greenSoft
        case .partiallyPaid: Theme.goldSoft
        case .overdue: Theme.redSoft
        case .unpaid: Theme.blueSoft
        }
    }

    var symbol: String {
        switch self {
        case .paid: "checkmark.seal.fill"
        case .partiallyPaid: "circle.lefthalf.filled"
        case .overdue: "exclamationmark.circle.fill"
        case .unpaid: "clock.badge.exclamationmark"
        }
    }
}

nonisolated enum PaymentMethod: String, Codable, Sendable {
    case cash
    case card
    case zainCash
    case bankTransfer

    var title: String {
        switch self {
        case .cash: "نقداً"
        case .card: "بطاقة"
        case .zainCash: "زين كاش"
        case .bankTransfer: "تحويل مصرفي"
        }
    }

    var symbol: String {
        switch self {
        case .cash: "banknote.fill"
        case .card: "creditcard.fill"
        case .zainCash: "iphone.gen3"
        case .bankTransfer: "building.columns.fill"
        }
    }
}

nonisolated struct Subscription: Codable, Sendable, Hashable {
    var monthlyFee: Int
    var yearlyFee: Int?
    var paidAmount: Int
    var dueAmount: Int
    var dueDate: Date
    var periodTitle: String

    var remaining: Int { max(0, dueAmount - paidAmount) }

    var progress: Double {
        guard dueAmount > 0 else { return 1 }
        return min(1, Double(paidAmount) / Double(dueAmount))
    }

    var status: AccountStatus {
        if remaining == 0 { return .paid }
        if dueDate < Calendar.current.startOfDay(for: .now) { return .overdue }
        if paidAmount > 0 { return .partiallyPaid }
        return .unpaid
    }

    var daysUntilDue: Int {
        Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: .now), to: dueDate).day ?? 0
    }
}

nonisolated struct Payment: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let amount: Int
    let date: Date
    let method: PaymentMethod
    let recordedBy: String
    let note: String
}
