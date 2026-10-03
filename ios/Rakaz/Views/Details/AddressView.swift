import SwiftUI
import MapKit

/// Student address with a draggable-by-pan map: the pin stays centered and the map moves under it.
struct AddressView: View {
    @Environment(FamilyStore.self) private var store
    let studentID: String

    @State private var draft: StudentAddress?
    @State private var camera: MapCameraPosition = .automatic
    @State private var isEditing: Bool = false
    @State private var isDragging: Bool = false
    @State private var saved: Bool = false

    var body: some View {
        Group {
            if let draft {
                content(draft)
            } else {
                ProgressView()
            }
        }
        .background(Theme.canvas)
        .navigationTitle("عنوان الطالب")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if isEditing {
                    Button("حفظ") { save() }.fontWeight(.bold)
                } else {
                    Button("تعديل") {
                        Haptics.tap()
                        withAnimation(.snappy) { isEditing = true }
                    }
                }
            }
        }
        .onAppear {
            guard draft == nil, let s = store.students.first(where: { $0.id == studentID }) else { return }
            draft = s.address
            camera = .region(MKCoordinateRegion(center: s.address.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.006, longitudeDelta: 0.006)))
        }
        .sensoryFeedback(.success, trigger: saved)
    }

    private func content(_ address: StudentAddress) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                mapCard(address)
                coordinatesCard(address)
                fieldsCard
                if isEditing {
                    Button {
                        save()
                    } label: {
                        Label("حفظ العنوان", systemImage: "checkmark")
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .transition(.opacity)
                }
                if saved && !isEditing {
                    Label("تم حفظ العنوان وإرساله للإدارة للمراجعة", systemImage: "checkmark.seal.fill")
                        .font(.plex(.footnote, .semibold))
                        .foregroundStyle(Theme.green)
                        .padding(12)
                        .frame(maxWidth: .infinity)
                        .background(Theme.greenSoft, in: .rect(cornerRadius: 14))
                        .transition(.opacity)
                }
            }
            .padding(16)
            .frame(maxWidth: 640)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func mapCard(_ address: StudentAddress) -> some View {
        ZStack {
            Map(position: $camera, interactionModes: isEditing ? [.pan, .zoom] : []) {
                if !isEditing {
                    Annotation("المنزل", coordinate: address.coordinate) {
                        MapPinBadge(symbol: "house.fill", tint: Theme.red)
                    }
                }
            }
            .mapStyle(.standard(pointsOfInterest: .excludingAll))
            .onMapCameraChange(frequency: .continuous) { _ in
                if isEditing && !isDragging { isDragging = true }
            }
            .onMapCameraChange(frequency: .onEnd) { ctx in
                guard isEditing else { return }
                isDragging = false
                Haptics.soft()
                draft?.latitude = ctx.region.center.latitude
                draft?.longitude = ctx.region.center.longitude
            }

            if isEditing {
                VStack(spacing: 0) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 42))
                        .foregroundStyle(.white, Theme.red)
                        .shadow(color: .black.opacity(0.25), radius: 6, y: 4)
                    Rectangle().fill(Theme.red).frame(width: 3, height: 14)
                    Ellipse().fill(.black.opacity(0.2)).frame(width: isDragging ? 8 : 14, height: 5)
                }
                .offset(y: isDragging ? -36 : -26)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)
                .allowsHitTesting(false)
            }
        }
        .frame(height: 300)
        .clipShape(.rect(cornerRadius: 24))
        .overlay(alignment: .bottom) {
            Text(isEditing ? "حرّك الخريطة لتثبيت الدبوس على موقع المنزل" : "اضغط «تعديل» لتغيير موقع الاستلام")
                .font(.plex(.caption, .semibold))
                .foregroundStyle(Theme.navy)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.regularMaterial, in: .capsule)
                .padding(12)
                .allowsHitTesting(false)
        }
    }

    private func coordinatesCard(_ address: StudentAddress) -> some View {
        HStack(spacing: 10) {
            coord("Latitude", address.latitude)
            coord("Longitude", address.longitude)
        }
    }

    private func coord(_ label: String, _ value: Double) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.plex(.caption)).foregroundStyle(Theme.muted)
            Text(Fmt.coordinate(value))
                .font(.system(.subheadline, design: .monospaced, weight: .bold))
                .foregroundStyle(Theme.ink)
                .contentTransition(.numericText())
        }
        .card(padding: 14, radius: 18)
    }

    private var fieldsCard: some View {
        VStack(spacing: 0) {
            field("building.2.fill", "المحافظة", \.governorate)
            RowDivider()
            field("map.fill", "المنطقة", \.area)
            RowDivider()
            field("house.and.flag.fill", "الحي", \.neighborhood)
            RowDivider()
            field("road.lanes", "الشارع", \.street)
            RowDivider()
            field("flag.fill", "أقرب نقطة دالة", \.landmark)
            RowDivider()
            field("note.text", "ملاحظات الوصول", \.accessNotes, multiline: true)
        }
        .card(padding: 12)
    }

    @ViewBuilder
    private func field(_ symbol: String, _ label: String, _ key: WritableKeyPath<StudentAddress, String>, multiline: Bool = false) -> some View {
        if isEditing {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.gold)
                    .frame(width: 34, height: 34)
                    .background(Theme.goldSoft, in: .rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(.plex(.caption)).foregroundStyle(Theme.muted)
                    TextField(label, text: binding(key), axis: multiline ? .vertical : .horizontal)
                        .font(.plex(.subheadline, .semibold))
                        .lineLimit(multiline ? 2...4 : 1...1)
                }
            }
            .padding(.vertical, 8)
        } else {
            InfoRow(symbol: symbol, label: label, value: draft?[keyPath: key] ?? "")
        }
    }

    private func binding(_ key: WritableKeyPath<StudentAddress, String>) -> Binding<String> {
        Binding(
            get: { draft?[keyPath: key] ?? "" },
            set: { draft?[keyPath: key] = $0 }
        )
    }

    private func save() {
        guard let draft else { return }
        store.updateAddress(draft, for: studentID)
        withAnimation(.snappy) {
            isEditing = false
            saved.toggle()
            saved = true
        }
        camera = .region(MKCoordinateRegion(center: draft.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.006, longitudeDelta: 0.006)))
    }
}
