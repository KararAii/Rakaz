import SwiftUI

@main
struct RakazApp: App {
    @State private var session: SessionStore = SessionStore()
    @State private var family: FamilyStore = FamilyStore()

    init() {
        PlexFont.register()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(session)
                .environment(family)
                .environment(\.layoutDirection, .rightToLeft)
                .environment(\.locale, Locale(identifier: "ar"))
                .font(.plex(.body))
                .preferredColorScheme(.light)
                .tint(Theme.gold)
        }
    }
}
