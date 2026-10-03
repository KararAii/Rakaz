import Foundation
import CoreLocation

nonisolated struct StudentAddress: Codable, Sendable, Hashable {
    var governorate: String
    var area: String
    var neighborhood: String
    var street: String
    var landmark: String
    var latitude: Double
    var longitude: Double
    var accessNotes: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var summary: String {
        [neighborhood, street, area].filter { !$0.isEmpty }.joined(separator: "، ")
    }
}
