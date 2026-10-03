import Foundation

/// Arabic-first formatting helpers (Arabic-Indic digits, Iraqi dinar, 12h clock with صباحاً/مساءً).
nonisolated enum Fmt {
    nonisolated(unsafe) private static let clockFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "hh:mm"
        return f
    }()

    nonisolated(unsafe) private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar")
        f.dateFormat = "EEEE، d MMMM yyyy"
        return f
    }()

    nonisolated(unsafe) private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar")
        f.dateFormat = "d MMMM yyyy"
        return f
    }()

    nonisolated(unsafe) private static let shortDayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ar")
        f.dateFormat = "EEEE d MMMM"
        return f
    }()

    nonisolated(unsafe) private static let numberFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "en_US_POSIX")
        f.groupingSeparator = "٬"
        f.usesGroupingSeparator = true
        f.maximumFractionDigits = 1
        return f
    }()

    nonisolated(unsafe) private static let relativeFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.locale = Locale(identifier: "ar")
        f.unitsStyle = .full
        return f
    }()

    private static let digitMap: [Character: Character] = [
        "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
        "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩"
    ]

    /// Converts Western digits to Arabic-Indic digits.
    static func digits(_ text: String) -> String {
        String(text.map { digitMap[$0] ?? $0 })
    }

    /// Converts Arabic-Indic / Persian digits back to Western digits (for input normalization).
    static func latinDigits(_ text: String) -> String {
        let arabic = Array("٠١٢٣٤٥٦٧٨٩")
        let persian = Array("۰۱۲۳۴۵۶۷۸۹")
        return String(text.map { ch in
            if let i = arabic.firstIndex(of: ch) { return Character(String(i)) }
            if let i = persian.firstIndex(of: ch) { return Character(String(i)) }
            return ch
        })
    }

    static func number(_ value: Double) -> String {
        digits(numberFormatter.string(from: NSNumber(value: value)) ?? "\(value)")
    }

    static func number(_ value: Int) -> String {
        number(Double(value))
    }

    static func money(_ value: Int) -> String {
        "\(number(value)) د.ع"
    }

    static func clock(_ date: Date) -> String {
        digits(clockFormatter.string(from: date))
    }

    static func period(_ date: Date) -> String {
        Calendar.current.component(.hour, from: date) < 12 ? "صباحاً" : "مساءً"
    }

    static func time(_ date: Date) -> String {
        "\(clock(date)) \(period(date))"
    }

    static func dayDate(_ date: Date) -> String {
        digits(dayFormatter.string(from: date))
    }

    static func date(_ date: Date) -> String {
        digits(dateFormatter.string(from: date))
    }

    static func shortDay(_ date: Date) -> String {
        digits(shortDayFormatter.string(from: date))
    }

    static func relative(_ date: Date) -> String {
        if abs(date.timeIntervalSinceNow) < 45 { return "الآن" }
        return digits(relativeFormatter.localizedString(for: date, relativeTo: .now))
    }

    static func coordinate(_ value: Double) -> String {
        String(format: "%.6f", value)
    }

    static func minutes(_ value: Int) -> String {
        "\(digits(String(value))) دقيقة"
    }
}
