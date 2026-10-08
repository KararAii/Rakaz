import SwiftUI

/// Design 63: after the return trip arrives home, the guardian confirms they received the child.
struct HandoverConfirmationView: View {
    @Environment(FamilyStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var confirmed: Bool = false
    @State private var pulse: Bool = false

    var body: some View {
        let student = store.student
        let arrival = store.returnTrip.eventDate(for: .arrivedAtSchool) ?? .now
        ScrollView {
            VStack(spacing: 0) {
                header(arrival)
                    .padding(.horizontal, 20)
                    .padding(.top, 6)
                    .padding(.bottom, 56)
                    .frame(maxWidth: 560)
                    .frame(maxWidth: .infinity)
                    .background(alignment: .bottom) {
                        BrandHeaderBackground(tealTone: true).padding(.top, -800)
                    }

                VStack(spacing: 18) {
                    ZStack {
                        Circle()
                            .fill(Theme.greenSoft)
                            .frame(width: 104, height: 104)
                            .scaleEffect(pulse ? 1.08 : 1)
                        Circle()
                            .fill(confirmed ? Theme.green : Color(hex: 0x7DBE9F))
                            .frame(width: 80, height: 80)
                        Image(systemName: confirmed ? "checkmark" : "house")
                            .font(.system(size: 32, weight: .medium))
                            .foregroundStyle(.white)
                            .contentTransition(.symbolEffect(.replace))
                    }
                    .padding(.top, 26)

                    VStack(spacing: 6) {
                        Text(confirmed ? "شكراً، تم تأكيد الاستلام" : "هل استقبلتِ \(student.firstName)؟")
                            .font(.plex(.title2, .bold))
                            .foregroundStyle(Theme.ink)
                            .contentTransition(.opacity)
                        Text(confirmed ? "أُغلقت الرحلة وتم إشعار فريق المدرسة." : "أكّدي الاستلام لتُغلق الرحلة ويطمئن فريق المدرسة.")
                            .font(.plex(.subheadline))
                            .foregroundStyle(Theme.muted)
                            .multilineTextAlignment(.center)
                    }

                    VStack(spacing: 14) {
                        HStack(spacing: 12) {
                            StudentAvatar(student: student, size: 48)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(student.fullName.split(separator: " ").prefix(2).joined(separator: " "))
                                    .font(.plex(.headline, .bold))
                                    .foregroundStyle(Theme.ink)
                                Text("\(student.grade) · رحلة العودة")
                                    .font(.plex(.caption))
                                    .foregroundStyle(Theme.muted)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 1) {
                                Text("الحالة").font(.plex(.caption2)).foregroundStyle(Theme.muted)
                                Label(confirmed ? "تم التأكيد" : "بانتظار التأكيد", systemImage: confirmed ? "checkmark.circle.fill" : "clock")
                                    .font(.plex(.caption, .bold))
                                    .foregroundStyle(Theme.greenDeep)
                            }
                        }
                        Rectangle().fill(Theme.line).frame(height: 1)
                        HStack {
                            Label("المنزل · البوابة الرئيسية", systemImage: "mappin")
                            Spacer()
                            Label("وصلت \(Fmt.clock(arrival))", systemImage: "clock")
                        }
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                        .labelStyle(GoldIconLabelStyle())
                    }
                    .card(padding: 18, radius: 24)

                    Button {
                        if confirmed {
                            dismiss()
                        } else {
                            store.confirmHandover()
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) { confirmed = true }
                        }
                    } label: {
                        Label(confirmed ? "تم" : "تأكيد استلام \(student.firstName)", systemImage: confirmed ? "checkmark" : "checkmark.shield")
                    }
                    .buttonStyle(PrimaryButtonStyle(fill: confirmed ? Theme.greenDeep : Theme.teal, height: 58))
                    .sensoryFeedback(.success, trigger: confirmed)

                    if !confirmed {
                        Button {
                            store.reportHandoverIssue()
                            dismiss()
                        } label: {
                            Text("لم تصلني بعد؟ أبلغي عن مشكلة")
                                .font(.plex(.footnote, .bold))
                                .foregroundStyle(Theme.ink.opacity(0.7))
                                .frame(minHeight: 44)
                        }
                    }

                    Label("بيانات طفلك محمية ومشفّرة", systemImage: "lock")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
                .frame(maxWidth: 560)
                .frame(maxWidth: .infinity)
                .background(
                    Color(hex: 0xEEF3F1)
                        .clipShape(UnevenRoundedRectangle(topLeadingRadius: 30, topTrailingRadius: 30))
                        .padding(.bottom, -800)
                )
                .padding(.top, -30)
            }
        }
        .scrollIndicators(.hidden)
        .background(Color(hex: 0xEEF3F1))
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) { pulse = true }
        }
    }

    private func header(_ arrival: Date) -> some View {
        VStack(spacing: 18) {
            HStack(spacing: 12) {
                MonogramTile(size: 44)
                VStack(alignment: .leading, spacing: 0) {
                    Text("تأكيد الوصول")
                        .font(.plex(.caption, .medium))
                        .foregroundStyle(Theme.goldLight)
                    Text("\(store.student.firstName) وصلت إلى المنزل")
                        .font(.plex(.title3, .bold))
                        .foregroundStyle(.white)
                }
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.goldLight)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("إغلاق")
            }
            HStack(spacing: 12) {
                Image(systemName: "house")
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.greenDeep)
                    .frame(width: 44, height: 44)
                    .background(Color(hex: 0xD0E9DC), in: .circle)
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 6) {
                        Circle().fill(Color(hex: 0x7DBE9F)).frame(width: 7, height: 7)
                        Text("المركبة وصلت").font(.plex(.subheadline, .bold)).foregroundStyle(.white)
                    }
                    Text("السائق بانتظار ولي الأمر عند المدخل الرئيسي.")
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.6))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text("وقت الوصول").font(.plex(.caption2)).foregroundStyle(.white.opacity(0.6))
                    Text(Fmt.clock(arrival)).font(.plex(.title3, .bold)).foregroundStyle(Theme.goldLight)
                }
            }
            .padding(14)
            .background(.white.opacity(0.07), in: .rect(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.12), lineWidth: 1))
        }
    }
}

struct GoldIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 5) {
            configuration.icon.foregroundStyle(Theme.gold)
            configuration.title
        }
    }
}
