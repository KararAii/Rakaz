import Foundation
import UserNotifications

/// Bridges trip events to the system notification center.
/// In production these arrive as remote push notifications from the Rakaz backend.
nonisolated enum NotificationService {
    static func requestAuthorization() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            print("[Notifications] authorization failed: \(error.localizedDescription)")
            return false
        }
    }

    static func post(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error { print("[Notifications] post failed: \(error.localizedDescription)") }
        }
    }
}
