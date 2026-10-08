import Foundation

nonisolated struct Driver: Codable, Sendable, Hashable {
    var name: String
    var photoName: String?
    var phone: String
    var rating: Double
    var yearsWithRakaz: Int
    var vehicle: Vehicle

    /// Only the last 4 digits are exposed in UI; the full number is used solely to place a call.
    var maskedPhone: String {
        let digits = phone.filter(\.isNumber)
        guard digits.count > 4 else { return phone }
        return "•••• ••• " + String(digits.suffix(4))
    }
}

nonisolated struct Vehicle: Codable, Sendable, Hashable {
    var model: String
    var type: String
    var plateNumber: String
    var color: String
    var capacity: Int
    var photoName: String?
    var busNumber: String
}
