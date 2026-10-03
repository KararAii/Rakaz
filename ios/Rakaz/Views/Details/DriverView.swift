import SwiftUI

/// Guardian-facing driver profile. Only non-sensitive fields are shown; the phone number is masked.
struct DriverView: View {
    @Environment(FamilyStore.self) private var store

    var body: some View {
        let driver = store.student.driver
        let vehicle = driver.vehicle
        ScrollView {
            VStack(spacing: 16) {
                vehicleHero(vehicle)

                HStack(spacing: 14) {
                    Avatar(imageName: driver.photoName, initials: String(driver.name.prefix(1)), size: 72, tint: Theme.navy)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("السائق").font(.plex(.caption)).foregroundStyle(Theme.muted)
                        Text(driver.name)
                            .font(.plex(.title3, .bold))
                            .foregroundStyle(Theme.ink)
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill").foregroundStyle(Theme.gold)
                            Text("\(Fmt.number(driver.rating)) · منذ \(Fmt.digits(String(driver.yearsWithRakaz))) سنوات مع ركاز")
                        }
                        .font(.plex(.caption, .semibold))
                        .foregroundStyle(Theme.muted)
                    }
                    Spacer()
                }
                .card(padding: 16)

                VStack(spacing: 0) {
                    InfoRow(symbol: "person.fill", label: "اسم السائق", value: driver.name)
                    RowDivider()
                    InfoRow(symbol: "phone.fill", label: "رقم الهاتف", value: driver.maskedPhone, mono: true)
                    RowDivider()
                    InfoRow(symbol: "bus.fill", label: "نوع المركبة", value: "\(vehicle.model) — \(vehicle.type)")
                    RowDivider()
                    InfoRow(symbol: "number.square.fill", label: "رقم المركبة", value: vehicle.plateNumber)
                    RowDivider()
                    InfoRow(symbol: "paintpalette.fill", label: "اللون", value: vehicle.color)
                }
                .card(padding: 12)

                if let url = URL(string: "tel://\(driver.phone)") {
                    Link(destination: url) {
                        Label("الاتصال بالسائق", systemImage: "phone.fill")
                    }
                    .buttonStyle(PrimaryButtonStyle(fill: Theme.green))
                }

                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "lock.shield.fill").foregroundStyle(Theme.blue)
                    Text("حفاظاً على الخصوصية، يتم إخفاء البيانات الحساسة للسائق مثل رقم الهاتف الكامل والعنوان ووثائق الهوية.")
                        .font(.plex(.caption))
                        .foregroundStyle(Theme.muted)
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.blueSoft, in: .rect(cornerRadius: 16))
            }
            .padding(16)
            .frame(maxWidth: 640)
            .frame(maxWidth: .infinity)
        }
        .background(Theme.canvas)
        .navigationTitle("بيانات السائق")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func vehicleHero(_ vehicle: Vehicle) -> some View {
        Color(Theme.navy)
            .frame(height: 210)
            .overlay {
                if let name = vehicle.photoName, let ui = UIImage(named: name) {
                    Image(uiImage: ui)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .allowsHitTesting(false)
                } else {
                    Image(systemName: "bus.fill")
                        .font(.system(size: 70))
                        .foregroundStyle(Theme.goldLight.opacity(0.7))
                }
            }
            .overlay {
                LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)
                    .allowsHitTesting(false)
            }
            .clipShape(.rect(cornerRadius: 24))
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(vehicle.model)
                        .font(.plex(.title3, .bold))
                        .foregroundStyle(.white)
                    Text("حافلة \(vehicle.busNumber) · \(Fmt.digits(String(vehicle.capacity))) مقعداً")
                        .font(.plex(.caption, .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                }
                .padding(16)
            }
            .overlay(alignment: .topTrailing) {
                Text(vehicle.plateNumber)
                    .font(.plex(.caption, .bold))
                    .foregroundStyle(Theme.navy)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.white, in: .rect(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.navy, lineWidth: 1.5))
                    .padding(14)
            }
    }
}
