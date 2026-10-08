import SwiftUI

nonisolated enum Route: Hashable {
    case student(String)
    case address(String)
    case school
    case driver
    case absences
    case notificationSettings
    case notifications
    case finance
    case liveTrip(TripKind)
}

struct RouteDestinations: ViewModifier {
    func body(content: Content) -> some View {
        content.navigationDestination(for: Route.self) { route in
            Group {
                switch route {
                case .student(let id): StudentProfileView(studentID: id)
                case .address(let id): AddressView(studentID: id)
                case .school: SchoolView()
                case .driver: DriverView()
                case .absences: AbsenceHistoryView()
                case .notificationSettings: NotificationSettingsView()
                case .notifications: NotificationsView()
                case .finance: FinanceView()
                case .liveTrip(let kind): TripLiveView(kind: kind)
                }
            }
        }
    }
}

extension View {
    func withRoutes() -> some View {
        modifier(RouteDestinations())
    }
}
