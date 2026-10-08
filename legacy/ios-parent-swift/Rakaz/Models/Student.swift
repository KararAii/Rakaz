import Foundation

nonisolated enum Gender: String, Codable, Sendable, CaseIterable {
    case male
    case female

    var title: String { self == .male ? "ذكر" : "أنثى" }
}

nonisolated struct Student: Identifiable, Codable, Sendable, Hashable {
    let id: String
    var fullName: String
    var firstName: String
    var photoName: String?
    var birthDate: Date
    var gender: Gender
    var grade: String
    var stage: String
    var schoolName: String
    var internalNumber: String
    var guardianName: String
    var guardianPhone: String
    var address: StudentAddress
    var school: School
    var driver: Driver

    var initials: String {
        let parts = fullName.split(separator: " ").prefix(2)
        return parts.compactMap { $0.first.map(String.init) }.joined(separator: " ")
    }

    var age: Int {
        Calendar.current.dateComponents([.year], from: birthDate, to: .now).year ?? 0
    }
}
