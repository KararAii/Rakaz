import SwiftUI
import MapKit

/// Live tracking for one trip. Morning uses the navy header (design 53), return uses the teal header (design 58).
struct TripLiveView: View {
    @Environment(FamilyStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let kind: TripKind

    @State private var camera: MapCameraPosition = .automatic
    @State private var followBus: Bool = true
    @State private var span: Double = 0.024

    private var isReturn: Bool { kind == .afternoon }

    var body: some View {
        let trip = store.trip(kind)
        let absent = store.isAbsent(on: kind)
        ScrollView {
            VStack(spacing: 0) {
                Group {
                    if isReturn { returnHeader(trip, absent) } else { morningHeader(trip, absent) }
                }
                .padding(.horizontal, 20)
                .padding(.top, 6)
                .padding(.bottom, 18)
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)
                .background(alignment: .bottom) {
                    BrandHeaderBackground(tealTone: isReturn).padding(.top, -800)
                }

                mapSection(trip)

                VStack(spacing: 16) {
                    if absent {
                        absentCard.padding(.top, -40)
                    } else {
                        etaCard(trip).padding(.top, -56)
                    }
                    if !absent {
                        driverCard
                        SectionTitle(title: "تفاصيل المسار", action: followBus ? nil : "تتبّع الحافلة", actionSymbol: "scope") {
                            followBus = true
                            recenter(on: store.vehicleCoordinate(kind))
                        }
                        routeDetails(trip)
                    }
                    updatesCard
                    actions
                    if trip.status == .finished || (store.morningTrip.status == .finished && store.returnTrip.status == .finished) {
                        Button {
                            store.restartDemo()
                        } label: {
                            Label("إعادة تشغيل العرض التجريبي", systemImage: "arrow.counterclockwise")
                        }
                        .buttonStyle(OutlineButtonStyle(tint: Theme.gold))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 30)
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)
            }
        }
        .scrollIndicators(.hidden)
        .background(Theme.canvas)
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden()
        .onAppear { recenter(on: store.vehicleCoordinate(kind), animated: false) }
        .onChange(of: trip.progress) { _, _ in
            if followBus { recenter(on: store.vehicleCoordinate(kind)) }
        }
        .onChange(of: trip.status) { _, _ in
            if followBus { recenter(on: store.vehicleCoordinate(kind)) }
        }
    }

    // MARK: Headers

    private func topBar(eyebrow: String, title: String) -> some View {
        HeaderBar(
            leading: ("chevron.backward", false, { dismiss() }),
            trailing: ("bell", store.unreadCount > 0, { store.showNotifications = true })
        ) {
            VStack(spacing: 0) {
                Text(eyebrow)
                    .font(.plex(.caption))
                    .foregroundStyle(.white.opacity(0.55))
                Text(title)
                    .font(.plex(.headline, .bold))
                    .foregroundStyle(.white)
            }
        }
    }

    private func morningHeader(_ trip: Trip, _ absent: Bool) -> some View {
        let driver = store.student.driver
        return VStack(spacing: 16) {
            topBar(eyebrow: "ركاز · تتبع مباشر", title: kind.title)
            HStack(spacing: 12) {
                Image(systemName: "bus")
                    .font(.system(size: 17))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(.white.opacity(0.08), in: .rect(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 0) {
                    Text("الحافلة \(driver.vehicle.plateNumber)")
                        .font(.plex(.subheadline, .bold))
                        .foregroundStyle(.white)
                    Text("\(driver.name) · \(trip.status.isActive ? "مباشر الآن" : "غير متصل")")
                        .font(.plex(.caption))
                        .foregroundStyle(.white.opacity(0.6))
                }
                Spacer()
                headerPill(trip, absent)
            }
        }
    }

    private func returnHeader(_ trip: Trip, _ absent: Bool) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                MonogramTile(size: 44)
                VStack(alignment: .leading, spacing: 0) {
                    Text("متابعة الرحلة")
                        .font(.plex(.caption, .medium))
                        .foregroundStyle(Theme.goldLight)
                    Text("عودة \(store.student.firstName) إلى المنزل")
                        .font(.plex(.title3, .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                Spacer()
                CircleIconButton(symbol: "chevron.backward") { dismiss() }
            }
            HStack {
                HStack(spacing: 10) {
                    Circle()
                        .fill(trip.status.isActive && !absent ? Theme.green : Theme.muted)
                        .frame(width: 10, height: 10)
                        .padding(4)
                        .background(Circle().fill((trip.status.isActive && !absent ? Theme.green : Theme.muted).opacity(0.25)))
                    VStack(alignment: .leading, spacing: 0) {
                        Text(absent ? "غياب مُبلَّغ" : (trip.status.isActive ? "الرحلة نشطة الآن" : trip.status.title(for: kind)))
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(.white)
                            .contentTransition(.opacity)
                        Text("آخر تحديث \(Fmt.relative(trip.updatedAt))")
                            .font(.plex(.caption2))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text("الوصول المتوقع")
                        .font(.plex(.caption2))
                        .foregroundStyle(.white.opacity(0.6))
                    Text(Fmt.clock(store.etaDate(kind)))
                        .font(.plex(.title2, .bold))
                        .foregroundStyle(Theme.goldLight)
                        .contentTransition(.numericText())
                }
            }
            .padding(14)
            .background(.white.opacity(0.07), in: .rect(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.12), lineWidth: 1))
        }
    }

    private func headerPill(_ trip: Trip, _ absent: Bool) -> some View {
        let text: String = absent ? "غياب" : (trip.status.isMoving ? "على الطريق" : (trip.hasArrived ? "وصلت" : trip.status == .notStarted ? "مجدولة" : "متوقفة"))
        return HStack(spacing: 6) {
            Circle().fill(.white.opacity(0.85)).frame(width: 6, height: 6)
            Text(text).font(.plex(.caption, .bold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(absent ? Theme.red : (trip.status.isActive ? Theme.greenDeep : Theme.muted), in: .capsule)
        .contentTransition(.opacity)
    }

    // MARK: Map

    private func mapSection(_ trip: Trip) -> some View {
        let legs = store.legs(for: kind)
        let bus = store.vehicleCoordinate(kind)
        return Map(position: $camera, interactionModes: [.pan, .zoom]) {
            MapPolyline(coordinates: legs.first)
                .stroke(Theme.navy.opacity(trip.status >= .arrivedAtPickup ? 0.18 : 0.4), style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round, dash: [1, 7]))
            MapPolyline(coordinates: legs.second)
                .stroke(.white.opacity(0.9), style: StrokeStyle(lineWidth: 10, lineCap: .round, lineJoin: .round))
            MapPolyline(coordinates: legs.second)
                .stroke(Theme.gold, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round, dash: [5, 6]))

            Annotation("", coordinate: store.homeCoordinate, anchor: .bottom) {
                MapPlaceLabel(symbol: "house.fill", title: "منزل العائلة", tint: Theme.gold)
            }
            Annotation("", coordinate: store.schoolCoordinate, anchor: .bottom) {
                MapPlaceLabel(symbol: "flag.fill", title: "المدرسة", tint: Theme.sage)
            }
            Annotation("", coordinate: bus) {
                BusMarker(moving: trip.status.isMoving, label: "الحافلة")
            }
        }
        .mapStyle(.standard(elevation: .flat, emphasis: .muted, pointsOfInterest: .excludingAll))
        .mapControlVisibility(.hidden)
        .onMapCameraChange(frequency: .onEnd) { ctx in
            span = ctx.region.span.latitudeDelta
        }
        .simultaneousGesture(DragGesture(minimumDistance: 12).onChanged { _ in followBus = false })
        .frame(height: 380)
        .overlay(alignment: .topLeading) {
            VStack(spacing: 10) {
                mapButton("location.viewfinder", label: "تتبّع الحافلة") {
                    followBus = true
                    recenter(on: store.vehicleCoordinate(kind))
                }
                .padding(.bottom, 8)
                mapButton("plus", label: "تكبير") { zoom(0.6) }
                mapButton("minus", label: "تصغير") { zoom(1.6) }
            }
            .padding(14)
        }
        .overlay(alignment: .bottomLeading) {
            Text("آخر تحديث \(Fmt.relative(trip.updatedAt))")
                .font(.plex(.caption2, .medium))
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(.white.opacity(0.85), in: .rect(cornerRadius: 8))
                .padding(.leading, 14)
                .padding(.bottom, 70)
        }
    }

    private func mapButton(_ symbol: String, label: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(Theme.ink)
                .frame(width: 44, height: 44)
                .background(.white, in: .rect(cornerRadius: 12))
                .shadow(color: .black.opacity(0.08), radius: 6, y: 2)
        }
        .buttonStyle(PressableStyle(scale: 0.9))
        .accessibilityLabel(label)
    }

    private func zoom(_ factor: Double) {
        span = min(max(span * factor, 0.004), 0.2)
        let center = followBus ? store.vehicleCoordinate(kind) : (camera.region?.center ?? store.vehicleCoordinate(kind))
        recenter(on: center)
    }

    private func recenter(on c: CLLocationCoordinate2D, animated: Bool = true) {
        let region = MKCoordinateRegion(center: c, span: MKCoordinateSpan(latitudeDelta: span, longitudeDelta: span))
        if animated {
            withAnimation(.smooth(duration: 0.9)) { camera = .region(region) }
        } else {
            camera = .region(region)
        }
    }

    // MARK: Cards

    private func etaCard(_ trip: Trip) -> some View {
        VStack(spacing: 14) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(store.etaTitle(kind))
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                    HStack(alignment: .lastTextBaseline, spacing: 6) {
                        Text(Fmt.clock(store.etaDate(kind)))
                            .font(.plex(size: 34, .bold, relativeTo: .largeTitle))
                            .foregroundStyle(Theme.ink)
                            .contentTransition(.numericText())
                        Text(Fmt.period(store.etaDate(kind)))
                            .font(.plex(.footnote))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    if trip.status.isActive {
                        Label(trip.hasArrived ? "وصلت" : "بعد \(Fmt.minutes(store.etaMinutes(kind)))", systemImage: "clock")
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(Theme.greenDeep)
                            .contentTransition(.numericText())
                    } else if trip.status == .notStarted {
                        Label("تبدأ \(Fmt.clock(trip.scheduledStart))", systemImage: "clock")
                            .font(.plex(.subheadline, .bold))
                            .foregroundStyle(Theme.gold)
                    }
                    Text("المسافة \(Fmt.number((store.remainingDistanceKm(kind) * 10).rounded() / 10)) كم")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                        .contentTransition(.numericText())
                }
                .padding(.bottom, 6)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.blueSoft)
                    Capsule()
                        .fill(Gradients.gold)
                        .frame(width: max(8, geo.size.width * store.overallProgress(kind)))
                }
            }
            .frame(height: 8)
            .animation(.linear(duration: 0.95), value: store.overallProgress(kind))

            HStack {
                Text(kind == .morning ? "منزل العائلة" : "المدرسة")
                Spacer()
                Text(trip.status.isActive ? trip.status.title(for: kind) : "")
                    .foregroundStyle(Theme.gold)
                    .fontWeight(.bold)
                Spacer()
                Text(kind == .morning ? "المدرسة" : "منزل العائلة")
            }
            .font(.plex(.caption, .medium))
            .foregroundStyle(Theme.muted)
        }
        .card(padding: 18, radius: 26)
        .shadow(color: Theme.navy.opacity(0.1), radius: 24, y: 12)
        .animation(.smooth, value: trip.status)
    }

    private var absentCard: some View {
        HStack(spacing: 12) {
            IconBadge(symbol: "calendar.badge.minus", tint: Theme.red, soft: Theme.redSoft, size: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.student.firstName) غائب عن هذه الرحلة")
                    .font(.plex(.headline, .bold))
                    .foregroundStyle(Theme.ink)
                Text("تم إبلاغ الإدارة والسائق، ولن تتوقف الحافلة عند المنزل.")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
        }
        .card(padding: 18, radius: 26)
    }

    private var driverCard: some View {
        let driver = store.student.driver
        return HStack(spacing: 12) {
            Image(systemName: "person")
                .font(.system(size: 20))
                .foregroundStyle(Theme.ink)
                .frame(width: 52, height: 52)
                .background(Theme.sageSoft, in: .circle)
            VStack(alignment: .leading, spacing: 1) {
                Text("السائق المسؤول").font(.plex(.caption)).foregroundStyle(Theme.muted)
                Text(driver.name)
                    .font(.plex(.headline, .bold))
                    .foregroundStyle(Theme.ink)
                HStack(spacing: 4) {
                    Image(systemName: "star.fill").font(.caption2)
                    Text("\(Fmt.number(driver.rating)) · منذ \(Fmt.digits(String(driver.yearsWithRakaz))) سنوات مع ركاز")
                }
                .font(.plex(.caption, .semibold))
                .foregroundStyle(Theme.gold)
            }
            Spacer()
            Button {
                store.open(.driver)
            } label: {
                Text("الملف")
                    .font(.plex(.footnote, .bold))
                    .foregroundStyle(Theme.gold)
                    .padding(.horizontal, 16)
                    .frame(height: 40)
                    .background(Theme.goldSoft, in: .rect(cornerRadius: 12))
            }
            .buttonStyle(PressableStyle())
        }
        .card(padding: 14)
    }

    private func routeDetails(_ trip: Trip) -> some View {
        let name = store.student.firstName
        let pickupTitle = kind == .morning ? "منزل العائلة" : store.student.school.name
        let dropTitle = kind == .morning ? store.student.school.name : "منزل العائلة"
        let midTitle = kind == .morning ? store.student.address.neighborhood : "شارع الكورنيش"
        let pickupDate = trip.eventDate(for: .studentPickedUp)
        let pickupETA = trip.status < .studentPickedUp ? Date.now.addingTimeInterval(Double(store.etaMinutes(kind)) * 60) : nil
        let eta = store.etaDate(kind)
        let midDate = pickupDate.map { Date(timeInterval: eta.timeIntervalSince($0) / 2, since: $0) }

        let pickupState: TimelineRow.State = trip.isPickedUp ? .done : (trip.status.isActive ? .current : .pending)
        let midState: TimelineRow.State = trip.hasArrived || (trip.status == .onTheWayToSchool && trip.progress > 0.5) ? .done : (trip.status == .onTheWayToSchool ? .current : .pending)
        let dropState: TimelineRow.State = trip.hasArrived ? .done : (trip.status == .onTheWayToSchool && trip.progress > 0.5 ? .current : .pending)

        return VStack(spacing: 0) {
            StationRow(title: pickupTitle, subtitle: trip.isPickedUp ? "تم الالتقاط · \(name)" : "نقطة الاستلام", time: pickupDate ?? pickupETA ?? trip.scheduledStart, state: pickupState, isLast: false)
            StationRow(title: midTitle, subtitle: midState == .done ? "تم العبور" : "توقف قادم", time: midDate, state: midState, isLast: false)
            StationRow(title: dropTitle, subtitle: trip.hasArrived ? "تم الوصول" : "الوصول المتوقع", time: eta, state: dropState, isLast: true)
        }
        .card(padding: 18)
        .animation(.smooth, value: trip.status)
    }

    private var updatesCard: some View {
        let updates = Array(store.notifications.filter { $0.kind.category == .trips }.prefix(3))
        return VStack(spacing: 0) {
            HStack {
                Label("آخر التحديثات", systemImage: "bell")
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Button {
                    store.showNotifications = true
                } label: {
                    HStack(spacing: 3) {
                        Text("كل التنبيهات")
                        Image(systemName: "chevron.left").font(.caption2.weight(.bold))
                    }
                    .font(.plex(.caption, .bold))
                    .foregroundStyle(Theme.gold)
                    .frame(minHeight: 36)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            Rectangle().fill(Theme.line).frame(height: 1)
            if updates.isEmpty {
                Text("لا توجد تحديثات بعد")
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
                    .padding(20)
            }
            ForEach(updates) { n in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: n.kind.symbol)
                        .font(.system(size: 13))
                        .foregroundStyle(n.kind.category == .trips && n.kind.tint == Theme.green ? Theme.greenDeep : Theme.gold)
                        .frame(width: 32, height: 32)
                        .background(n.kind.tint == Theme.green ? Theme.greenSoft : Theme.goldSoft, in: .rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(n.kind.title).font(.plex(.footnote, .bold)).foregroundStyle(Theme.ink)
                        Text(n.body).font(.plex(.caption)).foregroundStyle(Theme.muted).lineLimit(2)
                    }
                    Spacer()
                    Text(Fmt.relative(n.date))
                        .font(.plex(.caption2))
                        .foregroundStyle(Theme.muted)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding(.bottom, 6)
        .background(Theme.card, in: .rect(cornerRadius: 24))
        .shadow(color: Theme.navy.opacity(0.06), radius: 16, y: 6)
        .animation(.snappy, value: updates.map(\.id))
    }

    private var actions: some View {
        HStack(spacing: 10) {
            if let url = URL(string: "tel://\(store.student.driver.phone)") {
                Link(destination: url) {
                    Label("اتصال بالسائق", systemImage: "phone")
                }
                .buttonStyle(PrimaryButtonStyle(fill: isReturn ? Theme.teal : Theme.navy))
            }
            Button {
                store.tab = .support
            } label: {
                Label("الدعم", systemImage: "bubble.left")
            }
            .buttonStyle(OutlineButtonStyle())
        }
    }
}

struct StationRow: View {
    let title: String
    let subtitle: String
    let time: Date?
    let state: TimelineRow.State
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .stroke(state == .done ? Theme.green : (state == .current ? Theme.gold : Theme.muted.opacity(0.4)), lineWidth: 2)
                        .frame(width: 20, height: 20)
                    if state == .done {
                        Image(systemName: "checkmark").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.green)
                    } else if state == .current {
                        Circle().fill(Theme.gold).frame(width: 10, height: 10)
                    }
                }
                .frame(width: 24, height: 24)
                if !isLast {
                    DashedLine()
                        .stroke(Theme.muted.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [3, 3]))
                        .frame(width: 2)
                        .frame(minHeight: 32)
                }
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.plex(.subheadline, .bold))
                    .foregroundStyle(state == .pending ? Theme.ink.opacity(0.75) : Theme.ink)
                Text(subtitle)
                    .font(.plex(.caption))
                    .foregroundStyle(Theme.muted)
            }
            Spacer()
            if let time {
                Text(Fmt.clock(time))
                    .font(.plex(.footnote, .bold))
                    .foregroundStyle(state == .current ? Theme.gold : Theme.ink)
                    .contentTransition(.numericText())
                    .padding(.top, 2)
            }
        }
        .padding(.bottom, isLast ? 0 : 10)
    }
}

/// Map label chip with a pin, e.g. "منزل العائلة".
struct MapPlaceLabel: View {
    let symbol: String
    let title: String
    let tint: Color

    var body: some View {
        VStack(spacing: 3) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(tint, in: .circle)
                .overlay(Circle().stroke(.white, lineWidth: 2.5))
                .shadow(color: .black.opacity(0.18), radius: 4, y: 2)
            Text(title)
                .font(.plex(size: 10, .bold, relativeTo: .caption2))
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(.white, in: .rect(cornerRadius: 6))
                .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
        }
    }
}

struct MapPinBadge: View {
    let symbol: String
    let tint: Color

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 34, height: 34)
            .background(tint, in: .circle)
            .overlay(Circle().stroke(.white, lineWidth: 3))
            .shadow(color: .black.opacity(0.2), radius: 6, y: 3)
    }
}

/// Navy capsule "الحافلة" marker from the design with a pulsing halo while moving.
struct BusMarker: View {
    let moving: Bool
    var label: String = "الحافلة"

    var body: some View {
        ZStack {
            if moving {
                Capsule()
                    .fill(Theme.gold.opacity(0.3))
                    .frame(width: 96, height: 44)
                    .phaseAnimator([0.85, 1.15]) { c, s in
                        c.scaleEffect(s).opacity(1.6 - s)
                    } animation: { _ in .easeOut(duration: 1.2) }
            }
            HStack(spacing: 6) {
                Image(systemName: "location.north.fill")
                    .font(.system(size: 11, weight: .bold))
                    .rotationEffect(.degrees(-45))
                Text(label).font(.plex(.caption, .bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .frame(height: 34)
            .background(Theme.navy, in: .capsule)
            .overlay(Capsule().stroke(.white, lineWidth: 2.5))
            .shadow(color: Theme.navy.opacity(0.35), radius: 8, y: 4)
        }
    }
}
