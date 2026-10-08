import SwiftUI

/// "مركز المساعدة" (design 83): urgent call card, search, popular topics, recent questions and quick answers.
struct SupportView: View {
    @Environment(FamilyStore.self) private var store
    @State private var composer: TicketKind?
    @State private var expandedFAQ: Int?
    @State private var faqQuery: String = ""
    @State private var showAllFAQ: Bool = false

    private let adminPhone = "+9647801112233"
    private let whatsappNumber = "9647801112233"

    var body: some View {
        BrandScreen(overlap: 54) {
            header
        } content: {
            urgentCard
            searchField
            if faqQuery.trimmingCharacters(in: .whitespaces).isEmpty {
                SectionTitle(title: "المواضيع الشائعة", action: "عرض الكل") {
                    withAnimation(.snappy) { showAllFAQ = true }
                }
                topicsGrid
                SectionTitle(title: "تواصل معنا")
                contactRow
                if !store.tickets.isEmpty {
                    SectionTitle(title: "أسئلتك الأخيرة", action: "كل المحادثات") {
                        withAnimation(.snappy) { showAllFAQ = true }
                    }
                    ticketsSection
                }
            }
            faqSection
        }
        .sheet(item: $composer) { kind in
            TicketComposerSheet(kind: kind).environment(store)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 18) {
            HeaderBar(
                leading: nil,
                trailing: ("bell", store.unreadCount > 0, { store.showNotifications = true })
            ) {
                VStack(spacing: 0) {
                    Text("RAKAZ / CARE")
                        .font(.system(size: 10, weight: .semibold))
                        .tracking(2.5)
                        .foregroundStyle(Theme.goldLight)
                    Text("مركز المساعدة")
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(.white)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("نحن هنا عندما تحتاجنا")
                    .font(.plex(.subheadline))
                    .foregroundStyle(.white.opacity(0.7))
                Text("كيف يمكننا مساعدتك اليوم؟")
                    .font(.plex(size: 26, .bold, relativeTo: .title))
                    .foregroundStyle(.white)
            }
        }
    }

    private var urgentCard: some View {
        HStack(spacing: 12) {
            IconBadge(symbol: "headphones", tint: Theme.gold, soft: Color(hex: 0xF4E8D0), size: 50)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("مكالمة عاجلة؟")
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                    StatusPill(title: "متاح الآن", tint: Theme.greenDeep, soft: Theme.greenSoft)
                }
                Text("فريقنا يرد خلال أقل من دقيقتين")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
            Spacer(minLength: 4)
            if let url = URL(string: "tel://\(adminPhone)") {
                Link(destination: url) {
                    Label("اتصل بنا", systemImage: "phone")
                        .font(.plex(.footnote, .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .frame(height: 44)
                        .background(Theme.navy, in: .rect(cornerRadius: 12))
                }
                .buttonStyle(PressableStyle())
            }
        }
        .card(padding: 16, radius: 26)
        .shadow(color: Theme.navy.opacity(0.08), radius: 24, y: 12)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(Theme.muted)
            TextField("ابحث عن إجابة…", text: $faqQuery)
                .font(.plex(.subheadline))
            if !faqQuery.isEmpty {
                Button {
                    faqQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.muted)
                }
                .accessibilityLabel("مسح")
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 52)
        .background(Theme.card, in: .rect(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line, lineWidth: 1))
    }

    private var topicsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            topic("clock", "الرحلات والمواعيد", "تتبّع ووصول") { faqQuery = "رحلة" }
            topic("checkmark.shield", "سلامة الطفل", "إجراءات الحماية") { faqQuery = "السائق" }
            topic("person", "الحساب والعائلة", "بياناتك") { store.tab = .family }
            topic("bubble.left", "التواصل", "مع فريق ركاز") { composer = .feedback }
        }
    }

    private func topic(_ symbol: String, _ title: String, _ subtitle: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            HStack(spacing: 10) {
                IconBadge(symbol: symbol, tint: Theme.ink, soft: Theme.blueSoft, size: 38)
                VStack(alignment: .leading, spacing: 0) {
                    Text(title).font(.plex(.footnote, .bold)).foregroundStyle(Theme.ink).lineLimit(1).minimumScaleFactor(0.85)
                    Text(subtitle).font(.plex(.caption2)).foregroundStyle(Theme.muted).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 64)
            .background(Theme.card, in: .rect(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
        }
        .buttonStyle(PressableStyle())
    }

    private var contactRow: some View {
        HStack(spacing: 10) {
            if let url = URL(string: "https://wa.me/\(whatsappNumber)?text=\("مرحباً، أحتاج مساعدة بخصوص النقل المدرسي".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")") {
                Link(destination: url) {
                    ContactTile(symbol: "message", title: "WhatsApp", tint: Theme.whatsapp)
                }
                .buttonStyle(PressableStyle())
            }
            Button {
                Haptics.tap()
                composer = .complaint
            } label: {
                ContactTile(symbol: "exclamationmark.bubble", title: "شكوى", tint: Theme.red)
            }
            .buttonStyle(PressableStyle())
            Button {
                Haptics.tap()
                composer = .feedback
            } label: {
                ContactTile(symbol: "text.bubble", title: "ملاحظة", tint: Theme.gold)
            }
            .buttonStyle(PressableStyle())
        }
    }

    private var ticketsSection: some View {
        VStack(spacing: 10) {
            ForEach(store.tickets.prefix(showAllFAQ ? 20 : 2)) { t in
                HStack(spacing: 12) {
                    Text("س")
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 44, height: 44)
                        .background(Theme.blueSoft, in: .circle)
                        .overlay(alignment: .bottomLeading) {
                            Circle().fill(Theme.green).frame(width: 10, height: 10)
                                .overlay(Circle().stroke(.white, lineWidth: 2))
                        }
                    VStack(alignment: .leading, spacing: 1) {
                        HStack {
                            Text("\(t.kind.title) · \(t.topic.title)")
                                .font(.plex(.subheadline, .bold))
                                .foregroundStyle(Theme.ink)
                            Spacer()
                            Text(Fmt.relative(t.createdAt))
                                .font(.plex(.caption2))
                                .foregroundStyle(Theme.muted)
                        }
                        Text("\(Fmt.digits(t.id)) · \(t.status)")
                            .font(.plex(.caption))
                            .foregroundStyle(Theme.muted)
                            .lineLimit(1)
                    }
                }
                .card(padding: 14, radius: 20)
            }
        }
    }

    private var filteredFAQ: [FAQItem] {
        let q = faqQuery.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return showAllFAQ ? MockData.faqs : Array(MockData.faqs.prefix(4)) }
        return MockData.faqs.filter { $0.question.localizedStandardContains(q) || $0.answer.localizedStandardContains(q) }
    }

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "questionmark.circle").foregroundStyle(Theme.gold)
                Text(faqQuery.isEmpty ? "إجابات سريعة" : "نتائج البحث")
                    .font(.plex(.title3, .bold))
                    .foregroundStyle(Theme.ink)
            }
            .padding(.horizontal, 4)
            .padding(.top, 6)

            VStack(spacing: 0) {
                ForEach(filteredFAQ) { item in
                    let open = expandedFAQ == item.id
                    Button {
                        Haptics.selection()
                        withAnimation(.snappy) { expandedFAQ = open ? nil : item.id }
                    } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .top) {
                                Text(item.question)
                                    .font(.plex(.footnote, .bold))
                                    .foregroundStyle(Theme.ink)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "chevron.down")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(Theme.muted)
                                    .rotationEffect(.degrees(open ? 180 : 0))
                            }
                            if open {
                                Text(item.answer)
                                    .font(.plex(.footnote))
                                    .foregroundStyle(Theme.muted)
                                    .multilineTextAlignment(.leading)
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                            }
                        }
                        .padding(16)
                        .contentShape(.rect)
                    }
                    .buttonStyle(PressableStyle(scale: 0.99))
                    if item.id != filteredFAQ.last?.id {
                        Rectangle().fill(Theme.line).frame(height: 1)
                    }
                }
                if filteredFAQ.isEmpty {
                    ContentUnavailableView.search(text: faqQuery)
                }
            }
            .background(Theme.card, in: .rect(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.line, lineWidth: 1))

            if !showAllFAQ && faqQuery.isEmpty && MockData.faqs.count > 4 {
                Button {
                    withAnimation(.snappy) { showAllFAQ = true }
                } label: {
                    Text("عرض كل الأسئلة")
                        .font(.plex(.footnote, .bold))
                        .foregroundStyle(Theme.gold)
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
            }
        }
    }
}

extension TicketKind: Identifiable {
    var id: String { rawValue }
}

struct ContactTile: View {
    let symbol: String
    let title: String
    let tint: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.system(size: 18))
                .foregroundStyle(tint)
                .frame(width: 42, height: 42)
                .background(tint.opacity(0.1), in: .rect(cornerRadius: 13))
            Text(title)
                .font(.plex(.caption, .bold))
                .foregroundStyle(Theme.ink)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Theme.card, in: .rect(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
    }
}

struct TicketComposerSheet: View {
    @Environment(FamilyStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let kind: TicketKind

    @State private var topic: TicketTopic = .driver
    @State private var text: String = ""
    @State private var sent: Bool = false

    private var isValid: Bool { text.trimmingCharacters(in: .whitespacesAndNewlines).count >= 5 }

    var body: some View {
        NavigationStack {
            ScrollView {
                if sent {
                    VStack(spacing: 14) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(Theme.green)
                            .symbolEffect(.bounce, options: .nonRepeating)
                        Text("تم الإرسال بنجاح")
                            .font(.plex(.title2, .bold))
                            .foregroundStyle(Theme.ink)
                        Text("شكراً لك. ستراجع الإدارة \(kind == .complaint ? "شكواك" : "ملاحظتك") وتتواصل معك قريباً.")
                            .font(.plex(.subheadline))
                            .foregroundStyle(Theme.muted)
                            .multilineTextAlignment(.center)
                        Button("تم") { dismiss() }
                            .buttonStyle(PrimaryButtonStyle())
                            .padding(.top, 10)
                    }
                    .padding(24)
                    .padding(.top, 40)
                    .transition(.scale.combined(with: .opacity))
                } else {
                    VStack(alignment: .leading, spacing: 18) {
                        Text("الموضوع")
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(Theme.ink)
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
                            ForEach(TicketTopic.allCases, id: \.self) { t in
                                Button {
                                    Haptics.selection()
                                    topic = t
                                } label: {
                                    Text(t.title)
                                        .font(.plex(.footnote, .semibold))
                                        .foregroundStyle(topic == t ? .white : Theme.ink)
                                        .frame(maxWidth: .infinity, minHeight: 42)
                                        .background(topic == t ? Theme.navy : Theme.card, in: .capsule)
                                }
                                .buttonStyle(PressableStyle())
                            }
                        }
                        Text(kind == .complaint ? "تفاصيل الشكوى" : "ملاحظتك")
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(Theme.ink)
                        TextField("اكتب هنا…", text: $text, axis: .vertical)
                            .font(.plex(.body))
                            .lineLimit(5...10)
                            .padding(14)
                            .background(Theme.card, in: .rect(cornerRadius: 16))
                        Text("\(Fmt.digits(String(text.count)))/٥٠٠")
                            .font(.plex(.caption))
                            .foregroundStyle(Theme.muted)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                        Button {
                            store.submitTicket(kind: kind, topic: topic, body: text)
                            withAnimation(.spring) { sent = true }
                        } label: {
                            Label("إرسال", systemImage: "paperplane.fill")
                        }
                        .buttonStyle(PrimaryButtonStyle(fill: kind == .complaint ? Theme.red : Theme.navy))
                        .disabled(!isValid)
                        .opacity(isValid ? 1 : 0.5)
                    }
                    .padding(16)
                }
            }
            .background(Theme.canvas)
            .navigationTitle(kind == .complaint ? "إرسال شكوى" : "إرسال ملاحظة")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("إغلاق") { dismiss() }
                }
            }
            .onChange(of: text) { _, v in
                if v.count > 500 { text = String(v.prefix(500)) }
            }
        }
        .presentationDragIndicator(.visible)
    }
}
