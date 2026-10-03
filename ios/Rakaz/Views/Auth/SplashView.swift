import SwiftUI

struct SplashView: View {
    @Environment(SessionStore.self) private var session

    @State private var showLogo: Bool = false
    @State private var showTitle: Bool = false
    @State private var progress: CGFloat = 0
    @State private var sweep: Bool = false

    var body: some View {
        ZStack {
            BrandHeaderBackground().ignoresSafeArea()

            roadLines
                .opacity(0.5)

            VStack(spacing: 28) {
                Spacer()
                Image("RakazLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: 200)
                    .padding(22)
                    .background(.white, in: .rect(cornerRadius: 30))
                    .shadow(color: .black.opacity(0.35), radius: 30, y: 16)
                    .scaleEffect(showLogo ? 1 : 0.7)
                    .opacity(showLogo ? 1 : 0)

                VStack(spacing: 8) {
                    Text("ركاز")
                        .font(.plex(size: 40, .bold))
                        .foregroundStyle(.white)
                    Text("نظام النقل المدرسي الذكي")
                        .font(.plex(.headline, .medium))
                        .foregroundStyle(Theme.goldLight)
                    Text("تطبيق الطالب وولي الأمر")
                        .font(.plex(.footnote))
                        .foregroundStyle(.white.opacity(0.6))
                }
                .opacity(showTitle ? 1 : 0)
                .offset(y: showTitle ? 0 : 14)

                Spacer()

                VStack(spacing: 10) {
                    Capsule()
                        .fill(.white.opacity(0.12))
                        .frame(width: 140, height: 4)
                        .overlay(alignment: .leading) {
                            Capsule().fill(Gradients.gold)
                                .frame(width: 140 * progress, height: 4)
                        }
                    Text("رحلة آمنة كل يوم")
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.5))
                }
                .padding(.bottom, 30)
            }
            .padding(.horizontal, 24)
        }
        .task {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7)) { showLogo = true }
            withAnimation(.smooth(duration: 0.6).delay(0.35)) { showTitle = true }
            withAnimation(.easeInOut(duration: 2.1)) { progress = 1 }
            withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) { sweep = true }
            try? await Task.sleep(for: .seconds(2.3))
            session.finishSplash()
        }
    }

    private var roadLines: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            ZStack {
                Path { p in
                    p.move(to: CGPoint(x: -40, y: h * 0.86))
                    p.addQuadCurve(to: CGPoint(x: w + 40, y: h * 0.70), control: CGPoint(x: w * 0.5, y: h * 0.6))
                }
                .stroke(.white.opacity(0.18), style: StrokeStyle(lineWidth: 2))
                Path { p in
                    p.move(to: CGPoint(x: -40, y: h * 0.9))
                    p.addQuadCurve(to: CGPoint(x: w + 40, y: h * 0.76), control: CGPoint(x: w * 0.5, y: h * 0.66))
                }
                .stroke(Theme.gold.opacity(0.6), style: StrokeStyle(lineWidth: 2, dash: [14, 12], dashPhase: sweep ? -52 : 0))
            }
        }
        .allowsHitTesting(false)
    }
}
