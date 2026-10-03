import CoreLocation

/// Hand-tuned demo route through Basra: depot → student's home → school.
nonisolated enum RouteGeometry {
    static let depot = CLLocationCoordinate2D(latitude: 30.4932, longitude: 47.7712)

    static func toHome(home: CLLocationCoordinate2D) -> [CLLocationCoordinate2D] {
        [
            depot,
            CLLocationCoordinate2D(latitude: 30.4961, longitude: 47.7745),
            CLLocationCoordinate2D(latitude: 30.4978, longitude: 47.7801),
            CLLocationCoordinate2D(latitude: 30.5016, longitude: 47.7822),
            CLLocationCoordinate2D(latitude: 30.5031, longitude: 47.7856),
            home
        ]
    }

    static func toSchool(home: CLLocationCoordinate2D, school: CLLocationCoordinate2D) -> [CLLocationCoordinate2D] {
        [
            home,
            CLLocationCoordinate2D(latitude: 30.5072, longitude: 47.7903),
            CLLocationCoordinate2D(latitude: 30.5088, longitude: 47.7968),
            CLLocationCoordinate2D(latitude: 30.5121, longitude: 47.8019),
            CLLocationCoordinate2D(latitude: 30.5139, longitude: 47.8077),
            school
        ]
    }

    /// Point at fraction `t` (0...1) along a polyline, by distance.
    static func point(on path: [CLLocationCoordinate2D], at t: Double) -> CLLocationCoordinate2D {
        guard let first = path.first, path.count > 1 else { return path.first ?? depot }
        let clamped = min(max(t, 0), 1)
        var lengths: [Double] = []
        for i in 1..<path.count {
            lengths.append(distance(path[i - 1], path[i]))
        }
        let total = lengths.reduce(0, +)
        guard total > 0 else { return first }
        var target = total * clamped
        for (i, len) in lengths.enumerated() {
            if target <= len {
                let f = len == 0 ? 0 : target / len
                let a = path[i], b = path[i + 1]
                return CLLocationCoordinate2D(
                    latitude: a.latitude + (b.latitude - a.latitude) * f,
                    longitude: a.longitude + (b.longitude - a.longitude) * f
                )
            }
            target -= len
        }
        return path.last ?? first
    }

    static func length(of path: [CLLocationCoordinate2D]) -> Double {
        guard path.count > 1 else { return 0 }
        return (1..<path.count).reduce(0) { $0 + distance(path[$1 - 1], path[$1]) }
    }

    private static func distance(_ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> Double {
        CLLocation(latitude: a.latitude, longitude: a.longitude)
            .distance(from: CLLocation(latitude: b.latitude, longitude: b.longitude))
    }
}
