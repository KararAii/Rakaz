import Foundation
import CoreLocation

nonisolated struct School: Codable, Sendable, Hashable {
    var name: String
    var address: String
    var locationLabel: String
    var latitude: Double
    var longitude: Double
    var startHour: Int
    var startMinute: Int
    var endHour: Int
    var endMinute: Int
    var phone: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var startTime: Date {
        Calendar.current.date(bySettingHour: startHour, minute: startMinute, second: 0, of: .now) ?? .now
    }

    var endTime: Date {
        Calendar.current.date(bySettingHour: endHour, minute: endMinute, second: 0, of: .now) ?? .now
    }
}
