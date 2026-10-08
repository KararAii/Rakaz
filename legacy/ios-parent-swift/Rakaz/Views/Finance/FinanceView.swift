import SwiftUI

struct FinanceView: View {
    @Environment(FamilyStore.self) private var store
    @State private var selectedPayment: Payment?
    @State private var ringProgress: Double = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                if store.students.count > 1 {
                    StudentSwitcher()
                        .padding(.horizontal, -16)
                }
                balanceCard
                feesGrid
                dueCard
                statusLegend
                historySection
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 30)
            .frame(maxWidth: 640)
            .frame(maxWidth: .infinity)
        }
        .background(Theme.canvas)
        .navigationTitle("الاشتراك والمدفوعات")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedPayment) { payment in
            PaymentDetailSheet(payment: payment)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .onAppear { animateRing() }
        .onChange(of: store.selectedStudentID) { _, _ in
            ringProgress = 0
            animateRing()
        }
    }

    private func animateRing() {
        withAnimation(.spring(response: 1.1, dampingFraction: 0.85).delay(0.15)) {
            ringProgress = store.subscription.progress
        }
    }

    private var balanceCard: some View {
        let sub = store.subscription
        return VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(sub.periodTitle)
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.65))
                    Text(store.student.fullName)
                        .font(.plex(.headline, .bold))
                        .foregroundStyle(.white)
                }
                Spacer()
                StatusPill(title: sub.status.title, tint: sub.status.tint, soft: sub.status.soft, symbol: sub.status.symbol)
            }

            HStack(spacing: 18) {
                ZStack {
                    Circle().stroke(.white.opacity(0.12), lineWidth: 12)
                    Circle()
                        .trim(from: 0, to: ringProgress)
                        .stroke(Gradients.gold, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(Fmt.digits(String(Int(ringProgress * 100))))٪")
                            .font(.plex(.title2, .bold))
                            .foregroundStyle(.white)
                            .contentTransition(.numericText())
                        Text("مدفوع").font(.plex(.caption2)).foregroundStyle(.white.opacity(0.6))
                    }
                }
                .frame(width: 112, height: 112)

                VStack(alignment: .leading, spacing: 12) {
                    amountLine("المبلغ المدفوع", sub.paidAmount, Theme.goldLight)
                    amountLine("المبلغ المتبقي", sub.remaining, .white)
                    amountLine("إجمالي المستحق", sub.dueAmount, .white.opacity(0.7))
                }
            }
        }
        .padding(20)
        .background(
            ZStack {
                Gradients.navyCard
                Circle().fill(Theme.gold.opacity(0.18)).frame(width: 200).blur(radius: 40).offset(x: 120, y: -80)
            }
            .clipShape(.rect(cornerRadius: 26))
        )
        .shadow(color: Theme.navy.opacity(0.25), radius: 18, y: 10)
    }

    private func amountLine(_ label: String, _ value: Int, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).font(.plex(.caption2)).foregroundStyle(.white.opacity(0.6))
            Text(Fmt.money(value))
                .font(.plex(.headline, .bold))
                .foregroundStyle(color)
                .contentTransition(.numericText())
        }
    }

    private var feesGrid: some View {
        let sub = store.subscription
        return HStack(spacing: 10) {
            feeTile(symbol: "calendar", title: "الاشتراك الشهري", value: Fmt.money(sub.monthlyFee), tint: Theme.navy)
            feeTile(
                symbol: "calendar.badge.checkmark",
                title: "الاشتراك السنوي",
                value: sub.yearlyFee.map(Fmt.money) ?? "غير متوفر",
                tint: Theme.gold,
                note: sub.yearlyFee.map { "توفير \(Fmt.money(sub.monthlyFee * 12 - $0))" }
            )
        }
    }

    private func feeTile(symbol: String, title: String, value: String, tint: Color, note: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            IconBadge(symbol: symbol, tint: tint, soft: tint.opacity(0.1), size: 38)
            Text(title).font(.plex(.caption)).foregroundStyle(Theme.muted)
            Text(value)
                .font(.plex(.headline, .bold))
                .foregroundStyle(Theme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if let note {
                Text(note).font(.plex(.caption2, .semibold)).foregroundStyle(Theme.green)
            }
        }
        .card(padding: 14, radius: 20)
    }

    private var dueCard: some View {
        let sub = store.subscription
        let days = sub.daysUntilDue
        return HStack(spacing: 12) {
            IconBadge(symbol: "clock.fill", tint: sub.status == .overdue ? Theme.red : Theme.gold, soft: sub.status == .overdue ? Theme.redSoft : Theme.goldSoft, size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text("تاريخ الاستحقاق").font(.plex(.caption)).foregroundStyle(Theme.muted)
                Text(Fmt.date(sub.dueDate))
                    .font(.plex(.headline, .bold))
                    .foregroundStyle(Theme.ink)
            }
            Spacer()
            if sub.status == .paid {
                Text("لا توجد مستحقات").font(.plex(.caption, .bold)).foregroundStyle(Theme.green)
            } else {
                Text(days >= 0 ? "بعد \(Fmt.digits(String(days))) يوم" : "متأخر \(Fmt.digits(String(-days))) يوم")
                    .font(.plex(.caption, .bold))
                    .foregroundStyle(days >= 0 ? Theme.gold : Theme.red)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(days >= 0 ? Theme.goldSoft : Theme.redSoft, in: .capsule)
            }
        }
        .card(padding: 14, radius: 20)
    }

    private var statusLegend: some View {
        let current = store.subscription.status
        let all: [AccountStatus] = [.paid, .partiallyPaid, .overdue, .unpaid]
        return VStack(alignment: .leading, spacing: 10) {
            Text("حالة الحساب")
                .font(.plex(.subheadline, .bold))
                .foregroundStyle(Theme.ink)
            HStack(spacing: 6) {
                ForEach(all, id: \.self) { s in
                    let active = s == current
                    VStack(spacing: 6) {
                        Image(systemName: s.symbol).font(.system(size: 16, weight: .semibold))
                        Text(s.title).font(.plex(size: 11, .semibold)).lineLimit(1).minimumScaleFactor(0.7)
                    }
                    .foregroundStyle(active ? .white : s.tint)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(active ? s.tint : s.soft, in: .rect(cornerRadius: 14))
                    .scaleEffect(active ? 1.04 : 1)
                }
            }
        }
        .card(padding: 14, radius: 20)
    }

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("سجل الدفعات")
                    .font(.plex(.title3, .bold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Text("\(Fmt.digits(String(store.payments.count))) عمليات")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(store.payments) { payment in
                    Button {
                        Haptics.tap()
                        selectedPayment = payment
                    } label: {
                        PaymentRow(payment: payment)
                    }
                    .buttonStyle(PressableStyle(scale: 0.98))
                    if payment.id != store.payments.last?.id {
                        Rectangle().fill(Theme.line).frame(height: 1).padding(.leading, 60)
                    }
                }
            }
            .card(padding: 8, radius: 22)
        }
    }
}

struct PaymentRow: View {
    let payment: Payment

    var body: some View {
        HStack(spacing: 12) {
            IconBadge(symbol: payment.method.symbol, tint: Theme.green, soft: Theme.greenSoft, size: 42)
            VStack(alignment: .leading, spacing: 3) {
                Text(payment.method.title)
                    .font(.plex(.subheadline, .semibold))
                    .foregroundStyle(Theme.ink)
                Text("\(Fmt.date(payment.date)) · \(payment.id)")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
            Spacer()
            Text("+\(Fmt.money(payment.amount))")
                .font(.plex(.subheadline, .bold))
                .foregroundStyle(Theme.green)
            Image(systemName: "chevron.left").font(.plex(.caption2, .bold)).foregroundStyle(Theme.muted.opacity(0.6))
        }
        .padding(10)
        .contentShape(.rect)
    }
}

struct PaymentDetailSheet: View {
    let payment: Payment

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(Theme.green)
                        .symbolEffect(.bounce, options: .nonRepeating)
                    Text(Fmt.money(payment.amount))
                        .font(.plex(size: 34, .bold))
                        .foregroundStyle(Theme.ink)
                    Text("عملية دفع مسجّلة")
                        .font(.plex(.subheadline))
                        .foregroundStyle(Theme.muted)
                }
                .padding(.top, 24)

                VStack(spacing: 0) {
                    InfoRow(symbol: "number", label: "رقم العملية", value: payment.id, mono: true, copyable: true)
                    RowDivider()
                    InfoRow(symbol: "banknote", label: "المبلغ", value: Fmt.money(payment.amount))
                    RowDivider()
                    InfoRow(symbol: "calendar", label: "التاريخ", value: "\(Fmt.date(payment.date)) — \(Fmt.time(payment.date))")
                    RowDivider()
                    InfoRow(symbol: payment.method.symbol, label: "طريقة الدفع", value: payment.method.title)
                    RowDivider()
                    InfoRow(symbol: "person.badge.shield.checkmark", label: "الموظف الذي سجّل العملية", value: payment.recordedBy)
                    RowDivider()
                    InfoRow(symbol: "note.text", label: "ملاحظات", value: payment.note.isEmpty ? "لا توجد ملاحظات" : payment.note)
                }
                .card(padding: 14)

                ShareLink(item: receiptText) {
                    Label("مشاركة الإيصال", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.canvas)
    }

    private var receiptText: String {
        """
        إيصال دفع — ركاز للنقل
        رقم العملية: \(payment.id)
        المبلغ: \(Fmt.money(payment.amount))
        التاريخ: \(Fmt.date(payment.date))
        طريقة الدفع: \(payment.method.title)
        سجّلها: \(payment.recordedBy)
        """
    }
}
