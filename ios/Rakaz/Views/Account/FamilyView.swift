import SwiftUI

/// "ملف العائلة" (designs 73 / 78): family header, children, addresses, authorized contacts and settings.
struct FamilyView: View {
    @Environment(FamilyStore.self) private var store
    @Environment(SessionStore.self) private var session
    @State private var confirmLogout: Bool = false
    @State private var showAddChild: Bool = false

    var body: some View {
        BrandScreen(overlap: 60) {
            header
        } content: {
            summaryCard
            SectionTitle(title: "أطفالي", action: "إضافة طفل", actionSymbol: "plus") { showAddChild = true }
            ForEach(store.students) { s in
                ChildCard(student: s)
            }
            SectionTitle(title: "العناوين", action: "تعديل", actionSymbol: "pencil") {
                store.open(.address(store.selectedStudentID))
            }
            addresses
            SectionTitle(title: "جهات الاستلام المصرّح لها")
            contacts
            SectionTitle(title: "الحساب")
            menuSection
            Button(role: .destructive) {
                confirmLogout = true
            } label: {
                Label("تسجيل الخروج", systemImage: "rectangle.portrait.and.arrow.right")
            }
            .buttonStyle(PrimaryButtonStyle(fill: Theme.redSoft, foreground: Theme.red))
            Text("ركاز للنقل العام · الإصدار ١٫٠٫٠")
                .font(.plex(.caption))
                .foregroundStyle(Theme.muted)
        }
        .confirmationDialog("هل تريد تسجيل الخروج؟", isPresented: $confirmLogout, titleVisibility: .visible) {
            Button("تسجيل الخروج", role: .destructive) { session.logout() }
            Button("إلغاء", role: .cancel) {}
        }
        .alert("إضافة طفل", isPresented: $showAddChild) {
            Button("حسناً", role: .cancel) {}
        } message: {
            Text("تتم إضافة الأطفال الجدد عبر إدارة ركاز بعد التحقق من التسجيل. تواصل معنا من مركز المساعدة.")
        }
    }

    private var familyInitials: String {
        let name = session.account?.name ?? "أحمد محمد"
        return name.split(separator: " ").prefix(2).compactMap { $0.first.map(String.init) }.joined(separator: " ")
    }

    private var header: some View {
        VStack(spacing: 20) {
            HeaderBar(
                leading: ("pencil", false, { store.open(.address(store.selectedStudentID)) }),
                trailing: ("bell", store.unreadCount > 0, { store.showNotifications = true })
            ) {
                VStack(spacing: 0) {
                    Text("ركاز · مساحة العائلة")
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.55))
                    Text("ملف العائلة")
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(.white)
                }
            }
            HStack(spacing: 14) {
                Text(familyInitials)
                    .font(.plex(.title2, .bold))
                    .foregroundStyle(Theme.goldLight)
                    .frame(width: 60, height: 60)
                    .background(Color(hex: 0x2A2E2B), in: .rect(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.gold.opacity(0.4), lineWidth: 1))
                VStack(alignment: .leading, spacing: 1) {
                    Text(session.account?.familyName ?? "عائلة أحمد")
                        .font(.plex(.title3, .bold))
                        .foregroundStyle(.white)
                    Text("\(session.account?.type.title ?? "ولي الأمر") · \(session.account?.name ?? "")")
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.6))
                }
                Spacer()
                HStack(spacing: 5) {
                    Circle().fill(.white.opacity(0.8)).frame(width: 6, height: 6)
                    Text("حساب موثّق").font(.plex(.caption, .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Theme.greenDeep, in: .capsule)
            }
        }
    }

    private var summaryCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text("أطفال مسجلون").font(.plex(.caption)).foregroundStyle(Theme.muted)
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(Fmt.digits(String(store.students.count)))
                        .font(.plex(size: 32, .bold, relativeTo: .largeTitle))
                        .foregroundStyle(Theme.ink)
                    Text("أطفال").font(.plex(.footnote)).foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            HStack(spacing: -8) {
                ForEach(store.students) { s in
                    StudentAvatar(student: s, size: 36, filled: true)
                        .clipShape(.circle)
                        .overlay(Circle().stroke(.white, lineWidth: 2))
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("حالة الخدمة").font(.plex(.caption)).foregroundStyle(Theme.muted)
                Label("نشطة", systemImage: "checkmark")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.greenDeep)
            }
        }
        .card(padding: 18, radius: 26)
        .shadow(color: Theme.navy.opacity(0.08), radius: 24, y: 12)
    }

    private var addresses: some View {
        let s = store.student
        return VStack(spacing: 0) {
            Button {
                store.open(.address(s.id))
            } label: {
                addressRow(symbol: "house", title: "عنوان المنزل", subtitle: s.address.summary + "، " + s.address.governorate, tint: Theme.gold, soft: Theme.goldSoft, trailing: AnyView(StatusPill(title: "أساسي", tint: Theme.greenDeep, soft: Theme.greenSoft)))
                    .background(Theme.cream.opacity(0.7))
            }
            .buttonStyle(PressableStyle(scale: 0.99))
            Rectangle().fill(Theme.line).frame(height: 1)
            Button {
                store.open(.school)
            } label: {
                addressRow(symbol: "mappin.and.ellipse", title: s.school.name, subtitle: s.school.address, tint: Theme.ink, soft: Theme.sageSoft, trailing: AnyView(Text("مدرسة").font(.plex(.caption2)).foregroundStyle(Theme.muted)))
            }
            .buttonStyle(PressableStyle(scale: 0.99))
        }
        .background(Theme.card)
        .clipShape(.rect(cornerRadius: 24))
        .shadow(color: Theme.navy.opacity(0.06), radius: 16, y: 6)
    }

    private func addressRow(symbol: String, title: String, subtitle: String, tint: Color, soft: Color, trailing: AnyView) -> some View {
        HStack(spacing: 12) {
            IconBadge(symbol: symbol, tint: tint, soft: soft, size: 44)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.plex(.subheadline, .bold)).foregroundStyle(Theme.ink)
                Text(subtitle).font(.plex(.caption)).foregroundStyle(Theme.muted).lineLimit(1)
            }
            Spacer(minLength: 6)
            trailing
        }
        .padding(16)
        .contentShape(.rect)
    }

    private var contacts: some View {
        let s = store.student
        let people: [(String, String, String)] = [
            (s.guardianName, "الأب · جهة أساسية", s.guardianPhone),
            ("سارة أحمد", "الأم · جهة أساسية", "+9647705021881")
        ]
        return VStack(spacing: 10) {
            ForEach(people, id: \.0) { p in
                HStack(spacing: 12) {
                    Text(String(p.0.prefix(1)))
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 44, height: 44)
                        .background(Theme.blueSoft, in: .circle)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(p.0).font(.plex(.subheadline, .bold)).foregroundStyle(Theme.ink)
                        Text(p.1).font(.plex(.caption)).foregroundStyle(Theme.muted)
                    }
                    Spacer()
                    Label(masked(p.2), systemImage: "phone")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                        .environment(\.layoutDirection, .leftToRight)
                }
                .card(padding: 14, radius: 20)
            }
        }
    }

    private func masked(_ phone: String) -> String {
        let d = phone.filter(\.isNumber)
        return Fmt.digits("0" + String(d.dropFirst(3).prefix(3)) + " ••• " + String(d.suffix(4)))
    }

    private var menuSection: some View {
        VStack(spacing: 0) {
            menuRow("creditcard", "الاشتراك والمدفوعات", Theme.gold, Theme.goldSoft) { store.open(.finance) }
            RowDivider(inset: 56)
            menuRow("person.text.rectangle", "بيانات السائق والمركبة", Theme.ink, Theme.blueSoft) { store.open(.driver) }
            RowDivider(inset: 56)
            menuRow("calendar.badge.minus", "سجل الغياب", Theme.red, Theme.redSoft) { store.open(.absences) }
            RowDivider(inset: 56)
            menuRow("bell", "الإشعارات", Theme.greenDeep, Theme.greenSoft, badge: store.unreadCount) { store.open(.notifications) }
            RowDivider(inset: 56)
            menuRow("slider.horizontal.3", "إعدادات الإشعارات", Theme.muted, Theme.canvas) { store.open(.notificationSettings) }
        }
        .card(padding: 8)
    }

    private func menuRow(_ symbol: String, _ title: String, _ tint: Color, _ soft: Color, badge: Int = 0, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                IconBadge(symbol: symbol, tint: tint, soft: soft, size: 38)
                Text(title)
                    .font(.plex(.subheadline, .semibold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                if badge > 0 {
                    Text(Fmt.digits(String(badge)))
                        .font(.plex(.caption2, .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(Theme.gold, in: .capsule)
                }
                Image(systemName: "chevron.left").font(.caption.weight(.semibold)).foregroundStyle(Theme.muted.opacity(0.6))
            }
            .padding(10)
            .contentShape(.rect)
        }
        .buttonStyle(PressableStyle(scale: 0.98))
    }
}

/// Child card with avatar, grade/age, enrolment status and the bus strip (design 78).
struct ChildCard: View {
    @Environment(FamilyStore.self) private var store
    let student: Student

    var body: some View {
        let sub = store.subscription(for: student.id)
        VStack(spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                StudentAvatar(student: student, size: 52, filled: true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(student.fullName.split(separator: " ").prefix(2).joined(separator: " "))
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(Theme.ink)
                    Text("\(student.grade) · \(Fmt.digits(String(student.age))) سنوات")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                    HStack(spacing: 5) {
                        Circle().fill(Theme.green).frame(width: 6, height: 6)
                        Text(student.gender == .female ? "مسجلة في الرحلة" : "مسجّل في الرحلة")
                            .font(.plex(.caption, .semibold))
                            .foregroundStyle(Theme.greenDeep)
                    }
                    .padding(.top, 2)
                }
                Spacer()
                Menu {
                    Button("ملف الطالب", systemImage: "person.text.rectangle") { store.open(.student(student.id)) }
                    Button("العنوان", systemImage: "mappin.and.ellipse") { store.open(.address(student.id)) }
                    Button("الاشتراك: \(sub.status.title)", systemImage: "creditcard") {
                        store.select(student: student.id)
                        store.open(.finance)
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Theme.muted)
                        .frame(width: 36, height: 36)
                }
            }
            Button {
                store.open(.student(student.id))
            } label: {
                HStack {
                    Label("حافلة \(student.driver.vehicle.plateNumber)", systemImage: "bus")
                        .font(.plex(.caption, .medium))
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    HStack(spacing: 3) {
                        Text("التفاصيل")
                        Image(systemName: "chevron.left").font(.caption2.weight(.bold))
                    }
                    .font(.plex(.caption, .bold))
                    .foregroundStyle(Theme.gold)
                }
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(Theme.sageSoft, in: .rect(cornerRadius: 14))
            }
            .buttonStyle(PressableStyle(scale: 0.98))
        }
        .card(padding: 16)
    }
}
