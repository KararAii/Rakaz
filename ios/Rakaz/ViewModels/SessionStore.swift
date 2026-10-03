import SwiftUI

nonisolated enum AccountType: String, Codable, Sendable {
    case guardian
    case student

    var title: String { self == .guardian ? "ولي أمر" : "طالب" }
}

nonisolated struct Account: Codable, Sendable, Hashable {
    let phone: String
    let name: String
    let familyName: String
    let type: AccountType
}

nonisolated enum AuthError: LocalizedError {
    case invalidPhone
    case invalidCode
    case invalidPassword

    var errorDescription: String? {
        switch self {
        case .invalidPhone: "رقم الهاتف غير صحيح. أدخل رقماً عراقياً يبدأ بـ ٧ (١٠ أرقام)."
        case .invalidCode: "رمز التحقق غير صحيح. حاول مرة أخرى."
        case .invalidPassword: "كلمة المرور غير صحيحة."
        }
    }
}

@Observable
final class SessionStore {
    enum Phase: Equatable {
        case splash
        case login
        case resolvingAccount
        case main
    }

    static let demoCode = "123456"
    private static let accountKey = "rakaz.account"

    var phase: Phase = .splash
    private(set) var account: Account?

    init() {
        account = Storage.load(Account.self, key: Self.accountKey)
    }

    func finishSplash() {
        withAnimation(.smooth(duration: 0.5)) {
            phase = account == nil ? .login : .main
        }
    }

    /// Normalizes to a 10-digit local number starting with 7 (Iraqi mobile).
    static func normalize(_ raw: String) -> String {
        var digits = Fmt.latinDigits(raw).filter(\.isNumber)
        if digits.hasPrefix("964") { digits.removeFirst(3) }
        if digits.hasPrefix("0") { digits.removeFirst() }
        return digits
    }

    static func isValid(_ phone: String) -> Bool {
        let d = normalize(phone)
        return d.count == 10 && d.hasPrefix("7")
    }

    func requestOTP(phone: String) async throws {
        guard Self.isValid(phone) else { throw AuthError.invalidPhone }
        try? await Task.sleep(for: .milliseconds(900))
    }

    func verify(phone: String, code: String) async throws {
        try? await Task.sleep(for: .milliseconds(700))
        guard Fmt.latinDigits(code) == Self.demoCode else { throw AuthError.invalidCode }
        await signIn(phone: phone)
    }

    func login(phone: String, password: String) async throws {
        guard Self.isValid(phone) else { throw AuthError.invalidPhone }
        try? await Task.sleep(for: .milliseconds(800))
        guard password.count >= 4 else { throw AuthError.invalidPassword }
        await signIn(phone: phone)
    }

    /// After authentication the backend tells us the account type; guardians get the parent experience.
    private func signIn(phone: String) async {
        withAnimation(.smooth) { phase = .resolvingAccount }
        try? await Task.sleep(for: .milliseconds(1400))
        let account = Account(phone: "+964" + Self.normalize(phone), name: "أحمد محمد", familyName: "عائلة أحمد", type: .guardian)
        self.account = account
        Storage.save(account, key: Self.accountKey)
        Haptics.success()
        withAnimation(.smooth(duration: 0.6)) { phase = .main }
    }

    func logout() {
        account = nil
        UserDefaults.standard.removeObject(forKey: Self.accountKey)
        withAnimation(.smooth) { phase = .login }
    }
}
