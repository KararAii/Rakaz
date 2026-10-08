import SwiftUI

/// Springy press feedback used across tappable cards and buttons.
struct PressableStyle: ButtonStyle {
    var scale: CGFloat = 0.97

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    var fill: Color = Theme.navy
    var foreground: Color = .white
    var height: CGFloat = 56

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.plex(.headline, .bold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity, minHeight: height)
            .background(fill, in: .rect(cornerRadius: 18))
            .shadow(color: fill == Theme.navy || fill == Theme.teal ? fill.opacity(0.25) : .clear, radius: 12, y: 6)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

/// Outlined secondary action (white with hairline border).
struct OutlineButtonStyle: ButtonStyle {
    var tint: Color = Theme.ink

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.plex(.subheadline, .bold))
            .foregroundStyle(tint)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(Theme.card, in: .rect(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct CardModifier: ViewModifier {
    var padding: CGFloat = 16
    var radius: CGFloat = 24

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card, in: .rect(cornerRadius: radius))
            .shadow(color: Theme.navy.opacity(0.06), radius: 16, y: 6)
    }
}

extension View {
    func card(padding: CGFloat = 16, radius: CGFloat = 24) -> some View {
        modifier(CardModifier(padding: padding, radius: radius))
    }

    /// Navy navigation bar with light content, matching the Rakaz header style.
    func brandNavBar() -> some View {
        self
            .toolbar(.visible, for: .navigationBar)
            .toolbarBackground(Theme.navy, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
    }
}

struct StatusPill: View {
    let title: String
    let tint: Color
    let soft: Color
    var symbol: String?
    var pulsing: Bool = false
    var dot: Bool = false

    @State private var pulse: Bool = false

    var body: some View {
        HStack(spacing: 5) {
            if pulsing || dot {
                Circle()
                    .fill(tint)
                    .frame(width: 6, height: 6)
                    .overlay {
                        if pulsing {
                            Circle().stroke(tint, lineWidth: 2)
                                .scaleEffect(pulse ? 2.4 : 1)
                                .opacity(pulse ? 0 : 0.7)
                        }
                    }
            } else if let symbol {
                Image(systemName: symbol).font(.caption2.weight(.bold))
            }
            Text(title)
                .font(.plex(.caption, .bold))
                .lineLimit(1)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 11)
        .padding(.vertical, 5)
        .background(soft, in: .capsule)
        .onAppear {
            guard pulsing else { return }
            withAnimation(.easeOut(duration: 1.4).repeatForever(autoreverses: false)) { pulse = true }
        }
    }
}

struct IconBadge: View {
    let symbol: String
    var tint: Color = Theme.navy
    var soft: Color = Theme.blueSoft
    var size: CGFloat = 44

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: size * 0.42, weight: .regular))
            .foregroundStyle(tint)
            .frame(width: size, height: size)
            .background(soft, in: .rect(cornerRadius: size * 0.3))
    }
}

/// Photo avatar with initials fallback.
struct Avatar: View {
    let imageName: String?
    let initials: String
    var size: CGFloat = 52
    var tint: Color = Theme.gold

    var body: some View {
        Group {
            if let imageName, let ui = UIImage(named: imageName) {
                Color.clear
                    .overlay {
                        Image(uiImage: ui)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .allowsHitTesting(false)
                    }
            } else {
                ZStack {
                    tint
                    Text(initials)
                        .font(.plex(size: size * 0.34, .bold))
                        .foregroundStyle(.white)
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(.rect(cornerRadius: size * 0.3))
    }
}

/// Initial-letter tile used for children throughout the design (soft tint, ink/gold letter).
struct StudentAvatar: View {
    let student: Student
    var size: CGFloat = 52
    var filled: Bool = false
    var verified: Bool = false

    var body: some View {
        let female = student.gender == .female
        let bg: Color = filled ? (female ? Theme.goldLight : Theme.sage) : (female ? Theme.blueSoft : Color(hex: 0xF4E8D0))
        let fg: Color = filled ? .white : (female ? Theme.ink : Theme.gold)
        Text(filled ? student.initials.replacingOccurrences(of: " ", with: "") : String(student.firstName.prefix(1)))
            .font(.plex(size: size * (filled ? 0.3 : 0.36), .bold))
            .foregroundStyle(fg)
            .frame(width: size, height: size)
            .background(bg, in: .rect(cornerRadius: size * 0.3))
            .overlay(alignment: .bottomTrailing) {
                if verified {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: size * 0.3))
                        .foregroundStyle(.white, Theme.green)
                        .background(Circle().fill(.white).padding(1))
                        .offset(x: 4, y: 4)
                        .transition(.scale)
                }
            }
    }
}

struct SectionTitle: View {
    let title: String
    var action: String?
    var actionSymbol: String = "chevron.left"
    var onAction: (() -> Void)?

    var body: some View {
        HStack {
            Text(title)
                .font(.plex(.title3, .bold))
                .foregroundStyle(Theme.ink)
            Spacer()
            if let action, let onAction {
                Button {
                    Haptics.tap()
                    onAction()
                } label: {
                    HStack(spacing: 4) {
                        if actionSymbol != "chevron.left" {
                            Image(systemName: actionSymbol).font(.caption.weight(.bold))
                        }
                        Text(action)
                        if actionSymbol == "chevron.left" {
                            Image(systemName: actionSymbol).font(.caption2.weight(.bold))
                        }
                    }
                    .font(.plex(.footnote, .semibold))
                    .foregroundStyle(Theme.gold)
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.top, 6)
    }
}

/// Label/value row used in profile-style detail screens.
struct InfoRow: View {
    let symbol: String
    let label: String
    let value: String
    var mono: Bool = false
    var copyable: Bool = false

    @State private var copied: Bool = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(Theme.gold)
                .frame(width: 36, height: 36)
                .background(Theme.goldSoft, in: .rect(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
                Text(value.isEmpty ? "—" : value)
                    .font(mono ? .system(.subheadline, design: .monospaced, weight: .semibold) : .plex(.subheadline, .semibold))
                    .foregroundStyle(Theme.ink)
                    .multilineTextAlignment(.leading)
                    .environment(\.layoutDirection, mono ? .leftToRight : .rightToLeft)
            }
            Spacer(minLength: 0)
            if copyable {
                Button {
                    UIPasteboard.general.string = value
                    Haptics.tap()
                    withAnimation(.snappy) { copied = true }
                    Task {
                        try? await Task.sleep(for: .seconds(1.5))
                        withAnimation(.snappy) { copied = false }
                    }
                } label: {
                    Image(systemName: copied ? "checkmark" : "doc.on.doc")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(copied ? Theme.green : Theme.muted)
                        .frame(width: 36, height: 36)
                        .contentTransition(.symbolEffect(.replace))
                }
                .accessibilityLabel("نسخ \(label)")
            }
        }
        .padding(.vertical, 8)
    }
}

struct RowDivider: View {
    var inset: CGFloat = 48

    var body: some View {
        Rectangle().fill(Theme.line).frame(height: 1).padding(.leading, inset)
    }
}

/// Midnight navy header surface with faint concentric rings, as in the design file.
struct BrandHeaderBackground: View {
    var tealTone: Bool = false

    var body: some View {
        ZStack(alignment: .topLeading) {
            (tealTone ? Gradients.tealCard : Gradients.header)
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .stroke(.white.opacity(0.045), lineWidth: 1)
                    .frame(width: CGFloat(140 + i * 90), height: CGFloat(140 + i * 90))
                    .offset(x: CGFloat(-70 - i * 45), y: CGFloat(-40 - i * 45))
            }
        }
        .clipped()
        .allowsHitTesting(false)
    }
}

struct LogoBadge: View {
    var height: CGFloat = 40

    var body: some View {
        Image("RakazLogo")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(height: height)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(.white, in: .rect(cornerRadius: 6))
            .accessibilityLabel("ركاز")
    }
}

/// Small gold "ر" monogram tile used on the tracking and confirmation headers.
struct MonogramTile: View {
    var size: CGFloat = 44

    var body: some View {
        Text("ر")
            .font(.plex(size: size * 0.45, .bold))
            .foregroundStyle(Theme.navy)
            .frame(width: size, height: size)
            .background(Gradients.gold, in: .rect(cornerRadius: size * 0.28))
    }
}

struct CircleIconButton: View {
    let symbol: String
    var badge: Bool = false
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .regular))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(.white.opacity(0.08), in: .circle)
                .overlay(Circle().stroke(.white.opacity(0.14), lineWidth: 1))
                .overlay(alignment: .topTrailing) {
                    if badge {
                        Circle().fill(Theme.goldLight)
                            .frame(width: 8, height: 8)
                            .overlay(Circle().stroke(Theme.navy, lineWidth: 1.5))
                            .offset(x: -9, y: 9)
                            .transition(.scale)
                    }
                }
        }
        .buttonStyle(PressableStyle(scale: 0.9))
    }
}

/// Root-screen scaffold: navy header that bleeds under the status bar, with content cards overlapping its bottom edge.
struct BrandScreen<Header: View, Content: View>: View {
    var overlap: CGFloat = 0
    var roundedHeader: Bool = false
    var tealTone: Bool = false
    @ViewBuilder let header: () -> Header
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                header()
                    .padding(.horizontal, 20)
                    .padding(.top, 6)
                    .padding(.bottom, overlap + 22)
                    .frame(maxWidth: 640)
                    .frame(maxWidth: .infinity)
                    .background(alignment: .bottom) {
                        BrandHeaderBackground(tealTone: tealTone)
                            .clipShape(UnevenRoundedRectangle(bottomLeadingRadius: roundedHeader ? 30 : 0, bottomTrailingRadius: roundedHeader ? 30 : 0))
                            .padding(.top, -800)
                    }
                VStack(spacing: 16) {
                    content()
                }
                .padding(.horizontal, 16)
                .padding(.top, -overlap)
                .padding(.bottom, 28)
                .frame(maxWidth: 640)
                .frame(maxWidth: .infinity)
            }
        }
        .scrollIndicators(.hidden)
        .background(Theme.canvas)
        .toolbar(.hidden, for: .navigationBar)
    }
}

/// Header row: leading action, centered logo or title, trailing action.
struct HeaderBar<Center: View>: View {
    var leading: (symbol: String, badge: Bool, action: () -> Void)?
    var trailing: (symbol: String, badge: Bool, action: () -> Void)?
    @ViewBuilder let center: () -> Center

    var body: some View {
        ZStack {
            center()
            HStack {
                if let leading {
                    CircleIconButton(symbol: leading.symbol, badge: leading.badge, action: leading.action)
                }
                Spacer()
                if let trailing {
                    CircleIconButton(symbol: trailing.symbol, badge: trailing.badge, action: trailing.action)
                }
            }
        }
        .frame(minHeight: 48)
    }
}

/// Horizontal student switcher shown when the family has more than one child.
struct StudentSwitcher: View {
    @Environment(FamilyStore.self) private var store
    var dark: Bool = false

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(store.students) { s in
                    let selected = s.id == store.selectedStudentID
                    Button {
                        store.select(student: s.id)
                    } label: {
                        HStack(spacing: 8) {
                            StudentAvatar(student: s, size: 26)
                            Text(s.firstName)
                                .font(.plex(.subheadline, .semibold))
                        }
                        .padding(.leading, 4)
                        .padding(.trailing, 14)
                        .padding(.vertical, 4)
                        .foregroundStyle(selected ? (dark ? Theme.navy : .white) : (dark ? .white : Theme.ink))
                        .background(
                            selected ? (dark ? Color.white : Theme.navy) : (dark ? Color.white.opacity(0.08) : Theme.card),
                            in: .capsule
                        )
                        .overlay(Capsule().stroke(dark && !selected ? .white.opacity(0.12) : .clear, lineWidth: 1))
                    }
                    .buttonStyle(PressableStyle())
                }
            }
        }
        .scrollIndicators(.hidden)
        .contentMargins(.horizontal, 20)
    }
}

/// Bottom navigation matching the design: white rounded bar, gold active item.
struct RakazTabBar: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                let selected = store.tab == tab
                Button {
                    if store.tab == tab {
                        store.popToRoot(tab)
                    } else {
                        Haptics.selection()
                        store.tab = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: selected ? "\(tab.symbol).fill" : tab.symbol)
                            .font(.system(size: 19, weight: selected ? .semibold : .regular))
                            .frame(height: 24)
                            .symbolEffect(.bounce, value: selected)
                        Text(tab.title)
                            .font(.plex(.caption2, selected ? .bold : .medium))
                    }
                    .foregroundStyle(selected ? Theme.gold : Theme.muted)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .contentShape(.rect)
                }
                .buttonStyle(PressableStyle(scale: 0.92))
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 8)
        .frame(maxWidth: 640)
        .frame(maxWidth: .infinity)
        .background {
            UnevenRoundedRectangle(topLeadingRadius: 26, topTrailingRadius: 26)
                .fill(Theme.card)
                .shadow(color: Theme.navy.opacity(0.08), radius: 16, y: -4)
                .ignoresSafeArea(edges: .bottom)
        }
    }
}
