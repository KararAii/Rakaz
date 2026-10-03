import SwiftUI

struct StudentProfileView: View {
    @Environment(FamilyStore.self) private var store
    let studentID: String

    var body: some View {
        if let s = store.students.first(where: { $0.id == studentID }) {
            ScrollView {
                VStack(spacing: 18) {
                    hero(s)
                    VStack(spacing: 0) {
                        InfoRow(symbol: "person.fill", label: "الاسم الكامل", value: s.fullName)
                        RowDivider()
                        InfoRow(symbol: "gift.fill", label: "تاريخ الميلاد", value: "\(Fmt.date(s.birthDate)) (\(Fmt.digits(String(s.age))) سنوات)")
                        RowDivider()
                        InfoRow(symbol: s.gender == .female ? "figure.dress.line.vertical.figure" : "figure.stand", label: "الجنس", value: s.gender.title)
                        RowDivider()
                        InfoRow(symbol: "graduationcap.fill", label: "الصف", value: s.grade)
                        RowDivider()
                        InfoRow(symbol: "books.vertical.fill", label: "المرحلة الدراسية", value: s.stage)
                        RowDivider()
                        InfoRow(symbol: "building.columns.fill", label: "اسم المدرسة", value: s.schoolName)
                        RowDivider()
                        InfoRow(symbol: "number", label: "رقم الطالب الداخلي", value: s.internalNumber, mono: true, copyable: true)
                    }
                    .card(padding: 12)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("ولي الأمر")
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(Theme.muted)
                            .padding(.horizontal, 4)
                        VStack(spacing: 0) {
                            InfoRow(symbol: "person.2.fill", label: "اسم ولي الأمر", value: s.guardianName)
                            RowDivider()
                            InfoRow(symbol: "phone.fill", label: "رقم ولي الأمر", value: s.guardianPhone, mono: true)
                        }
                        .card(padding: 12)
                    }

                    VStack(spacing: 10) {
                        NavigationLink(value: Route.address(s.id)) {
                            linkTile("mappin.and.ellipse", "عنوان الطالب", s.address.summary, Theme.red)
                        }
                        NavigationLink(value: Route.school) {
                            linkTile("building.columns.fill", "بيانات المدرسة", s.school.name, Theme.teal)
                        }
                        NavigationLink(value: Route.driver) {
                            linkTile("bus.fill", "السائق والمركبة", "\(s.driver.name) · \(s.driver.vehicle.model)", Theme.navy)
                        }
                    }
                    .buttonStyle(PressableStyle(scale: 0.98))
                }
                .padding(16)
                .frame(maxWidth: 640)
                .frame(maxWidth: .infinity)
            }
            .background(Theme.canvas)
            .navigationTitle("ملف الطالب")
            .navigationBarTitleDisplayMode(.inline)
        } else {
            ContentUnavailableView("الطالب غير موجود", systemImage: "person.crop.circle.badge.questionmark")
        }
    }

    private func hero(_ s: Student) -> some View {
        VStack(spacing: 12) {
            Avatar(imageName: s.photoName, initials: String(s.firstName.prefix(1)), size: 108, tint: s.gender == .female ? Theme.gold : Theme.blue)
                .overlay(RoundedRectangle(cornerRadius: 32.4).stroke(.white, lineWidth: 4))
                .shadow(color: Theme.navy.opacity(0.2), radius: 16, y: 8)
            Text(s.fullName)
                .font(.plex(.title2, .bold))
                .foregroundStyle(Theme.ink)
            HStack(spacing: 8) {
                StatusPill(title: s.grade, tint: Theme.navy, soft: Theme.blueSoft)
                StatusPill(title: s.stage, tint: Theme.gold, soft: Theme.goldSoft)
            }
        }
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
    }

    private func linkTile(_ symbol: String, _ title: String, _ subtitle: String, _ tint: Color) -> some View {
        HStack(spacing: 12) {
            IconBadge(symbol: symbol, tint: tint, soft: tint.opacity(0.1), size: 42)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.plex(.subheadline, .bold)).foregroundStyle(Theme.ink)
                Text(subtitle).font(.plex(.caption)).foregroundStyle(Theme.muted).lineLimit(1)
            }
            Spacer()
            Image(systemName: "chevron.left").font(.plex(.caption, .bold)).foregroundStyle(Theme.muted.opacity(0.6))
        }
        .card(padding: 12, radius: 18)
    }
}
