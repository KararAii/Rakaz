import SwiftUI
import MapKit

struct SchoolView: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        let school = store.student.school
        ScrollView {
            VStack(spacing: 16) {
                Map(initialPosition: .region(MKCoordinateRegion(center: school.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.008, longitudeDelta: 0.008)))) {
                    Annotation(school.name, coordinate: school.coordinate) {
                        MapPinBadge(symbol: "graduationcap.fill", tint: Theme.navy)
                    }
                }
                .mapStyle(.standard(pointsOfInterest: .excludingAll))
                .frame(height: 220)
                .clipShape(.rect(cornerRadius: 24))
                .overlay(alignment: .bottomLeading) {
                    Button {
                        Haptics.tap()
                        let item = MKMapItem(placemark: MKPlacemark(coordinate: school.coordinate))
                        item.name = school.name
                        item.openInMaps()
                    } label: {
                        Label("فتح في الخرائط", systemImage: "arrow.triangle.turn.up.right.diamond.fill")
                            .font(.plex(.caption, .bold))
                            .foregroundStyle(Theme.navy)
                            .padding(.horizontal, 12)
                            .frame(height: 38)
                            .background(.regularMaterial, in: .capsule)
                    }
                    .padding(12)
                }

                HStack(spacing: 10) {
                    timeTile("بداية الدوام", school.startTime, "sunrise.fill", Theme.gold)
                    timeTile("انتهاء الدوام", school.endTime, "sunset.fill", Theme.teal)
                }

                VStack(spacing: 0) {
                    InfoRow(symbol: "building.columns.fill", label: "اسم المدرسة", value: school.name)
                    RowDivider()
                    InfoRow(symbol: "map.fill", label: "عنوان المدرسة", value: school.address)
                    RowDivider()
                    InfoRow(symbol: "mappin.circle.fill", label: "موقع المدرسة", value: school.locationLabel)
                    RowDivider()
                    InfoRow(symbol: "location.north.fill", label: "Latitude", value: Fmt.coordinate(school.latitude), mono: true, copyable: true)
                    RowDivider()
                    InfoRow(symbol: "location.fill", label: "Longitude", value: Fmt.coordinate(school.longitude), mono: true, copyable: true)
                }
                .card(padding: 12)
            }
            .padding(16)
            .frame(maxWidth: 640)
            .frame(maxWidth: .infinity)
        }
        .background(Theme.canvas)
        .navigationTitle("بيانات المدرسة")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func timeTile(_ title: String, _ date: Date, _ symbol: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: symbol)
                .font(.plex(.caption, .semibold))
                .foregroundStyle(tint)
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(Fmt.clock(date))
                    .font(.plex(.title, .bold))
                    .foregroundStyle(Theme.ink)
                Text(Fmt.period(date)).font(.plex(.caption)).foregroundStyle(Theme.muted)
            }
        }
        .card(padding: 14, radius: 20)
    }
}
