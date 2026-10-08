import SwiftUI

struct MainTabView: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        @Bindable var store = store
        TabView(selection: $store.tab) {
            NavigationStack(path: $store.homePath) {
                HomeView().withRoutes()
            }
            .toolbar(.hidden, for: .tabBar)
            .tag(AppTab.home)

            NavigationStack(path: $store.tripsPath) {
                TripsView().withRoutes()
            }
            .toolbar(.hidden, for: .tabBar)
            .tag(AppTab.trips)

            NavigationStack(path: $store.familyPath) {
                FamilyView().withRoutes()
            }
            .toolbar(.hidden, for: .tabBar)
            .tag(AppTab.family)

            NavigationStack(path: $store.supportPath) {
                SupportView().withRoutes()
            }
            .toolbar(.hidden, for: .tabBar)
            .tag(AppTab.support)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if !store.isTabBarHidden {
                RakazTabBar()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.smooth(duration: 0.3), value: store.isTabBarHidden)
        .overlay(alignment: .top) {
            if let banner = store.banner {
                NotificationBanner(notification: banner) {
                    store.dismissBanner()
                    store.markRead(banner.id)
                    if banner.kind == .delivered && store.handoverPending {
                        return
                    }
                    store.showNotifications = true
                }
                .padding(.horizontal, 14)
                .frame(maxWidth: 560)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $store.showNotifications) {
            NavigationStack {
                NotificationsView()
                    .withRoutes()
            }
            .presentationDragIndicator(.visible)
        }
        .fullScreenCover(isPresented: $store.handoverPending) {
            HandoverConfirmationView()
        }
        .task {
            store.startSimulation()
            _ = await NotificationService.requestAuthorization()
        }
    }
}

struct NotificationBanner: View {
    let notification: AppNotification
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: notification.kind.symbol)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.navy)
                    .frame(width: 40, height: 40)
                    .background(Gradients.gold, in: .rect(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 1) {
                    Text(notification.kind.title)
                        .font(.plex(.subheadline, .bold))
                        .foregroundStyle(.white)
                    Text(notification.body)
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.72))
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(Theme.navy.opacity(0.97), in: .rect(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(Theme.gold.opacity(0.3), lineWidth: 1))
            .shadow(color: .black.opacity(0.25), radius: 20, y: 10)
        }
        .buttonStyle(PressableStyle())
        .sensoryFeedback(.impact(weight: .light), trigger: notification.id)
    }
}
