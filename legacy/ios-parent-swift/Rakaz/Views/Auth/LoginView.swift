import SwiftUI

struct LoginView: View {
    @Environment(SessionStore.self) private var session

    private enum Step: Equatable {
        case phone
        case otp
        case password
    }

    private enum Field: Hashable {
        case phone, otp, password
    }

    @State private var step: Step = .phone
    @State private var phone: String = ""
    @State private var code: String = ""
    @State private var password: String = ""
    @State private var showPassword: Bool = false
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var resendIn: Int = 0
    @State private var shake: Int = 0
    @FocusState private var focus: Field?

    var body: some View {
        ZStack(alignment: .top) {
            Theme.canvas.ignoresSafeArea()

            BrandHeaderBackground()
                .frame(height: 330)
                .clipShape(UnevenRoundedRectangle(bottomLeadingRadius: 36, bottomTrailingRadius: 36))
                .ignoresSafeArea(edges: .top)

            ScrollView {
                VStack(spacing: 22) {
                    header
                    formCard
                        .modifier(ShakeEffect(animatableData: CGFloat(shake)))
                    footer
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
            .scrollBounceBehavior(.basedOnSize)

            if session.phase == .resolvingAccount {
                ResolvingAccountOverlay()
                    .transition(.opacity)
            }
        }
        .task(id: resendIn) {
            guard resendIn > 0 else { return }
            try? await Task.sleep(for: .seconds(1))
            resendIn -= 1
        }
    }

    // MARK: Sections

    private var header: some View {
        VStack(spacing: 18) {
            LogoBadge(height: 46)
                .padding(.top, 18)
            VStack(spacing: 6) {
                Text(headerTitle)
                    .font(.plex(size: 28, .bold))
                    .foregroundStyle(.white)
                    .contentTransition(.opacity)
                Text(headerSubtitle)
                    .font(.plex(.subheadline))
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.bottom, 4)
    }

    private var headerTitle: String {
        switch step {
        case .phone: "أهلاً بك في ركاز"
        case .otp: "رمز التحقق"
        case .password: "الدخول بكلمة المرور"
        }
    }

    private var headerSubtitle: String {
        switch step {
        case .phone: "سجّل الدخول برقم هاتفك لمتابعة رحلات أطفالك"
        case .otp: "أرسلنا رمزاً من ٦ أرقام إلى \(displayPhone)"
        case .password: "كلمة المرور اختيارية لمن قام بتفعيلها"
        }
    }

    private var displayPhone: String {
        let d = SessionStore.normalize(phone)
        return "+964 " + d
    }

    @ViewBuilder
    private var formCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            switch step {
            case .phone: phoneStep
            case .otp: otpStep
            case .password: passwordStep
            }

            if let errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.circle.fill")
                    .font(.plex(.footnote, .medium))
                    .foregroundStyle(Theme.red)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.redSoft, in: .rect(cornerRadius: 12))
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .card(padding: 20, radius: 26)
        .animation(.snappy, value: step)
        .animation(.snappy, value: errorMessage)
    }

    private var phoneStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            fieldLabel("رقم الهاتف")
            HStack(spacing: 10) {
                HStack(spacing: 6) {
                    Text("🇮🇶")
                    Text("+964")
                        .font(.plex(.body, .semibold))
                        .foregroundStyle(Theme.ink)
                }
                .padding(.horizontal, 12)
                .frame(height: 54)
                .background(Theme.canvas, in: .rect(cornerRadius: 14))

                TextField("7XX XXX XXXX", text: $phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .font(.plex(.title3, .semibold))
                    .foregroundStyle(Theme.ink)
                    .focused($focus, equals: .phone)
                    .padding(.horizontal, 14)
                    .frame(height: 54)
                    .background(Theme.canvas, in: .rect(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(focus == .phone ? Theme.gold : .clear, lineWidth: 1.5))
            }
            .environment(\.layoutDirection, .leftToRight)

            Button {
                Task { await sendCode() }
            } label: {
                loadingLabel("إرسال رمز التحقق", symbol: "arrow.left")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isLoading)

            HStack {
                Rectangle().fill(Theme.line).frame(height: 1)
                Text("أو").font(.plex(.caption)).foregroundStyle(Theme.muted)
                Rectangle().fill(Theme.line).frame(height: 1)
            }

            Button {
                go(.password)
            } label: {
                Label("الدخول بكلمة المرور", systemImage: "key.fill")
            }
            .buttonStyle(PrimaryButtonStyle(fill: Theme.goldSoft, foreground: Theme.navy))
        }
    }

    private var otpStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                fieldLabel("أدخل الرمز")
                Spacer()
                Button("تغيير الرقم") { go(.phone) }
                    .font(.plex(.footnote, .semibold))
                    .foregroundStyle(Theme.gold)
            }

            OTPField(code: $code, isFocused: $focus, field: .otp, hasError: errorMessage != nil)
                .onChange(of: code) { _, newValue in
                    errorMessage = nil
                    if newValue.count == 6 { Task { await verify() } }
                }

            HStack(spacing: 6) {
                Image(systemName: "info.circle")
                Text("للتجربة استخدم الرمز \(Fmt.digits(SessionStore.demoCode))")
            }
            .font(.plex(.caption))
            .foregroundStyle(Theme.muted)

            Button {
                Task { await verify() }
            } label: {
                loadingLabel("تأكيد الدخول", symbol: "checkmark")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isLoading || code.count < 6)
            .opacity(code.count < 6 ? 0.6 : 1)

            HStack {
                Text("لم يصلك الرمز؟").foregroundStyle(Theme.muted)
                if resendIn > 0 {
                    Text("إعادة الإرسال بعد \(Fmt.digits(String(resendIn))) ث")
                        .foregroundStyle(Theme.ink)
                        .monospacedDigit()
                } else {
                    Button("إعادة الإرسال") {
                        Haptics.tap()
                        code = ""
                        resendIn = 45
                    }
                    .foregroundStyle(Theme.gold)
                    .fontWeight(.semibold)
                }
            }
            .font(.plex(.footnote))
            .frame(maxWidth: .infinity)
        }
    }

    private var passwordStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            fieldLabel("رقم الهاتف")
            HStack(spacing: 8) {
                Text("+964").foregroundStyle(Theme.muted)
                TextField("7XX XXX XXXX", text: $phone)
                    .keyboardType(.phonePad)
                    .focused($focus, equals: .phone)
            }
            .font(.plex(.body, .semibold))
            .padding(.horizontal, 14)
            .frame(height: 52)
            .background(Theme.canvas, in: .rect(cornerRadius: 14))
            .environment(\.layoutDirection, .leftToRight)

            fieldLabel("كلمة المرور")
            HStack {
                Group {
                    if showPassword {
                        TextField("••••••", text: $password)
                    } else {
                        SecureField("••••••", text: $password)
                    }
                }
                .textContentType(.password)
                .focused($focus, equals: .password)
                Button {
                    showPassword.toggle()
                } label: {
                    Image(systemName: showPassword ? "eye.slash" : "eye")
                        .foregroundStyle(Theme.muted)
                        .frame(width: 36, height: 36)
                }
                .accessibilityLabel(showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور")
            }
            .padding(.horizontal, 14)
            .frame(height: 52)
            .background(Theme.canvas, in: .rect(cornerRadius: 14))

            Button {
                Task { await loginWithPassword() }
            } label: {
                loadingLabel("تسجيل الدخول", symbol: "arrow.left")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isLoading)

            Button {
                go(.phone)
            } label: {
                Label("الدخول برمز التحقق OTP", systemImage: "message.fill")
                    .font(.plex(.footnote, .semibold))
                    .foregroundStyle(Theme.gold)
                    .frame(maxWidth: .infinity)
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "lock.shield.fill").foregroundStyle(Theme.green)
                Text("بياناتك محمية ومشفّرة")
            }
            .font(.plex(.footnote, .medium))
            .foregroundStyle(Theme.muted)
            Text("يتم تحديد نوع الحساب تلقائياً بعد تسجيل الدخول")
                .font(.plex(.caption))
                .foregroundStyle(Theme.muted.opacity(0.8))
        }
    }

    // MARK: Helpers

    private func fieldLabel(_ text: String) -> some View {
        Text(text)
            .font(.plex(.subheadline, .semibold))
            .foregroundStyle(Theme.ink)
    }

    private func loadingLabel(_ title: String, symbol: String) -> some View {
        HStack(spacing: 10) {
            if isLoading {
                ProgressView().tint(.white)
            } else {
                Text(title)
                Image(systemName: symbol).font(.plex(.subheadline, .bold))
            }
        }
    }

    private func go(_ next: Step) {
        Haptics.tap()
        errorMessage = nil
        withAnimation(.snappy) { step = next }
    }

    private func fail(_ error: Error) {
        Haptics.error()
        errorMessage = error.localizedDescription
        withAnimation(.default) { shake += 1 }
    }

    private func sendCode() async {
        focus = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await session.requestOTP(phone: phone)
            code = ""
            resendIn = 45
            go(.otp)
            focus = .otp
        } catch {
            fail(error)
        }
    }

    private func verify() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            try await session.verify(phone: phone, code: code)
        } catch {
            code = ""
            fail(error)
        }
    }

    private func loginWithPassword() async {
        focus = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await session.login(phone: phone, password: password)
        } catch {
            fail(error)
        }
    }
}

/// Six-box OTP input backed by a single hidden text field.
struct OTPField<F: Hashable>: View {
    @Binding var code: String
    var isFocused: FocusState<F?>.Binding
    let field: F
    var hasError: Bool

    var body: some View {
        ZStack {
            TextField("", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused(isFocused, equals: field)
                .opacity(0.02)
                .onChange(of: code) { _, newValue in
                    let filtered = String(Fmt.latinDigits(newValue).filter(\.isNumber).prefix(6))
                    if filtered != newValue { code = filtered }
                }

            HStack(spacing: 8) {
                ForEach(0..<6, id: \.self) { i in
                    let chars = Array(code)
                    let char: String = i < chars.count ? String(chars[i]) : ""
                    let active = i == chars.count && isFocused.wrappedValue == field
                    Text(Fmt.digits(char))
                        .font(.plex(size: 24, .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(char.isEmpty ? Theme.canvas : Theme.goldSoft, in: .rect(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(hasError ? Theme.red : (active ? Theme.gold : .clear), lineWidth: 1.5)
                        )
                        .scaleEffect(char.isEmpty ? 1 : 1.03)
                        .animation(.spring(response: 0.25, dampingFraction: 0.6), value: char)
                }
            }
            .allowsHitTesting(false)
        }
        .environment(\.layoutDirection, .leftToRight)
        .contentShape(.rect)
        .onTapGesture { isFocused.wrappedValue = field }
    }
}

struct ShakeEffect: GeometryEffect {
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(translationX: 8 * sin(animatableData * .pi * 4), y: 0))
    }
}

/// Shown while the backend resolves the account type after authentication.
struct ResolvingAccountOverlay: View {
    @State private var spin: Bool = false

    var body: some View {
        ZStack {
            Theme.navy.opacity(0.92).ignoresSafeArea()
            VStack(spacing: 18) {
                ZStack {
                    Circle().stroke(.white.opacity(0.1), lineWidth: 4)
                    Circle()
                        .trim(from: 0, to: 0.3)
                        .stroke(Gradients.gold, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(spin ? 360 : 0))
                    Image(systemName: "person.badge.shield.checkmark.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(Theme.goldLight)
                }
                .frame(width: 86, height: 86)
                Text("جارٍ تحديد نوع الحساب…")
                    .font(.plex(.headline, .semibold))
                    .foregroundStyle(.white)
                Text("حساب ولي أمر ← واجهة ولي الأمر")
                    .font(.plex(.footnote))
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 0.9).repeatForever(autoreverses: false)) { spin = true }
        }
    }
}
