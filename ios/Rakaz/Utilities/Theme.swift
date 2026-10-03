import SwiftUI
import CoreText

/// Brand palette sampled from the Rakaz design file: midnight navy headers, brushed gold accents,
/// warm off-white canvas and soft tinted surfaces.
nonisolated enum Theme {
    static let navy = Color(hex: 0x071D36)
    static let navyDeep = Color(hex: 0x05152A)
    static let navyRaised = Color(hex: 0x0E233B)
    static let teal = Color(hex: 0x143B4A)
    static let tealDeep = Color(hex: 0x0F2F3C)
    static let gold = Color(hex: 0xC09034)
    static let goldLight = Color(hex: 0xE0B25C)
    static let goldSoft = Color(hex: 0xFBF1DF)
    static let cream = Color(hex: 0xFBF4E7)
    static let canvas = Color(hex: 0xF3F4F1)
    static let card = Color.white
    static let ink = Color(hex: 0x0E233B)
    static let muted = Color(hex: 0x8191A4)
    static let line = Color(hex: 0xEBEDEA)
    static let green = Color(hex: 0x3D8B66)
    static let greenDeep = Color(hex: 0x2D6B54)
    static let greenSoft = Color(hex: 0xE4F0E9)
    static let red = Color(hex: 0xC4533F)
    static let redSoft = Color(hex: 0xF9E6E1)
    static let blue = Color(hex: 0x3D6A93)
    static let blueSoft = Color(hex: 0xE9EFF4)
    static let sage = Color(hex: 0x89AAA1)
    static let sageSoft = Color(hex: 0xE9F0EF)
    static let whatsapp = Color(hex: 0x25A35A)
}

extension Color {
    nonisolated init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

enum Gradients {
    static var header: LinearGradient {
        LinearGradient(colors: [Theme.navyDeep, Theme.navy], startPoint: .top, endPoint: .bottom)
    }

    static var gold: LinearGradient {
        LinearGradient(colors: [Theme.goldLight, Theme.gold], startPoint: .leading, endPoint: .trailing)
    }

    static var navyCard: LinearGradient {
        LinearGradient(colors: [Theme.navyRaised, Theme.navy], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    static var tealCard: LinearGradient {
        LinearGradient(colors: [Theme.teal, Theme.tealDeep], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

// MARK: - Typography (IBM Plex Sans Arabic)

nonisolated enum PlexFont {
    static let names: [String] = [
        "IBMPlexSansArabic-Regular",
        "IBMPlexSansArabic-Medium",
        "IBMPlexSansArabic-SemiBold",
        "IBMPlexSansArabic-Bold"
    ]

    static func name(for weight: Font.Weight) -> String {
        switch weight {
        case .bold, .heavy, .black: "IBMPlexSansArabic-Bold"
        case .semibold: "IBMPlexSansArabic-SemiBold"
        case .medium: "IBMPlexSansArabic-Medium"
        default: "IBMPlexSansArabic-Regular"
        }
    }

    static func size(for style: Font.TextStyle) -> CGFloat {
        switch style {
        case .largeTitle: 34
        case .title: 28
        case .title2: 22
        case .title3: 20
        case .headline: 17
        case .body: 17
        case .callout: 16
        case .subheadline: 15
        case .footnote: 13
        case .caption: 12
        case .caption2: 11
        default: 17
        }
    }

    /// Registers the bundled font files for this process and themes UIKit chrome with them.
    @MainActor
    static func register() {
        var urls: [URL] = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: nil) ?? []
        urls += Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: "Fonts") ?? []
        for url in urls where url.lastPathComponent.hasPrefix("IBMPlexSansArabic") {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }

        let ink = UIColor(Theme.ink)
        if let title = UIFont(name: "IBMPlexSansArabic-Bold", size: 17),
           let large = UIFont(name: "IBMPlexSansArabic-Bold", size: 32) {
            UINavigationBar.appearance().titleTextAttributes = [.font: title, .foregroundColor: ink]
            UINavigationBar.appearance().largeTitleTextAttributes = [.font: large, .foregroundColor: ink]
        }
        if let seg = UIFont(name: "IBMPlexSansArabic-SemiBold", size: 13) {
            UISegmentedControl.appearance().setTitleTextAttributes([.font: seg], for: .normal)
        }
        if let item = UIFont(name: "IBMPlexSansArabic-SemiBold", size: 16) {
            UIBarButtonItem.appearance().setTitleTextAttributes([.font: item], for: .normal)
        }
    }
}

extension Font {
    /// Brand font scaled with Dynamic Type relative to the given text style.
    static func plex(_ style: Font.TextStyle = .body, _ weight: Font.Weight = .regular) -> Font {
        .custom(PlexFont.name(for: weight), size: PlexFont.size(for: style), relativeTo: style)
    }

    static func plex(size: CGFloat, _ weight: Font.Weight = .regular, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom(PlexFont.name(for: weight), size: size, relativeTo: style)
    }
}
