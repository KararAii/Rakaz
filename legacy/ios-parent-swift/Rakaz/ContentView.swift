import SwiftUI

struct ContentView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        ZStack {
            switch session.phase {
            case .splash:
                SplashView()
                    .transition(.opacity)
            case .login, .resolvingAccount:
                LoginView()
                    .transition(.opacity)
            case .main:
                MainTabView()
                    .transition(.opacity.combined(with: .scale(scale: 1.02)))
            }
        }
        .animation(.smooth(duration: 0.5), value: session.phase)
    }
}
