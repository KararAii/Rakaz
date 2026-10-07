import { ArrowLeft, Check, CircleAlert, Eye, EyeOff, Info, Key, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { BrandHeaderBackground } from '@/components/Brand';
import { PrimaryButton } from '@/components/Buttons';
import { OTPField, type OTPFieldHandle } from '@/components/OTPField';
import { PressableScale } from '@/components/PressableScale';
import { LogoBadge } from '@/components/Primitives';
import { card, Fonts, Theme, withAlpha } from '@/constants/theme';
import { AuthError, DEMO_CODE, normalizePhone, useSession } from '@/store/sessionStore';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';

type Step = 'phone' | 'otp' | 'password';

/** Physical-left text alignment for LTR inputs (native RTL swaps left/right). */
const LTR_ALIGN = Platform.OS === 'web' ? 'left' : 'right';

export default function LoginScreen() {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const otp = useRef<OTPFieldHandle>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const go = (next: Step) => {
    Haptics.tap();
    setErrorMessage(null);
    setStep(next);
  };

  const fail = (error: unknown) => {
    Haptics.error();
    setErrorMessage(error instanceof Error ? error.message : AuthError.invalidCode.message);
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 350, easing: Easing.linear, useNativeDriver: true }).start();
  };

  const run = async (task: () => Promise<void>, onError?: () => void) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      await task();
    } catch (error) {
      onError?.();
      fail(error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const sendCode = () => {
    Keyboard.dismiss();
    void run(async () => {
      await session.requestOTP(phone);
      setCode('');
      setResendIn(45);
      go('otp');
      setTimeout(() => otp.current?.focus(), 350);
    });
  };

  const verify = (value: string = code) => {
    void run(
      () => session.verify(phone, value),
      () => setCode(''),
    );
  };

  const loginWithPassword = () => {
    Keyboard.dismiss();
    void run(() => session.login(phone, password));
  };

  const headerTitle = step === 'phone' ? 'أهلاً بك في ركاز' : step === 'otp' ? 'رمز التحقق' : 'الدخول بكلمة المرور';
  const headerSubtitle =
    step === 'phone'
      ? 'سجّل الدخول برقم هاتفك لمتابعة رحلات أطفالك'
      : step === 'otp'
        ? `أرسلنا رمزاً من ٦ أرقام إلى ${`+964 ${normalizePhone(phone)}`}`
        : 'كلمة المرور اختيارية لمن قام بتفعيلها';

  const shakeX = shake.interpolate({
    inputRange: [0, 0.125, 0.375, 0.625, 0.875, 1],
    outputRange: [0, 8, -8, 8, -8, 0],
  });

  return (
    <View style={styles.root}>
      <BrandHeaderBackground style={[styles.headerBg, { height: 330 + insets.top }]} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        bounces={false}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <LogoBadge height={46} />
          </View>
          <AppText size={28} weight="bold" color={Theme.white} align="center">
            {headerTitle}
          </AppText>
          <AppText size="subheadline" color={withAlpha(Theme.white, 0.7)} align="center">
            {headerSubtitle}
          </AppText>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeX }] }]}>
          {step === 'phone' ? (
            <View style={styles.stack18}>
              <AppText size="subheadline" weight="semibold">
                رقم الهاتف
              </AppText>
              <View style={styles.ltrRow}>
                <View style={styles.prefix}>
                  <AppText size="body">🇮🇶</AppText>
                  <AppText size="body" weight="semibold">
                    +964
                  </AppText>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="7XX XXX XXXX"
                  placeholderTextColor={withAlpha(Theme.muted, 0.7)}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  onSubmitEditing={sendCode}
                  style={[styles.phoneInput, { borderColor: phoneFocused ? Theme.gold : 'transparent' }]}
                  accessibilityLabel="رقم الهاتف"
                />
              </View>
              <PrimaryButton title="إرسال رمز التحقق" icon={ArrowLeft} trailingIcon onPress={sendCode} loading={isLoading} />
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <AppText size="caption" color={Theme.muted}>
                  أو
                </AppText>
                <View style={styles.orLine} />
              </View>
              <PrimaryButton title="الدخول بكلمة المرور" icon={Key} fill={Theme.goldSoft} foreground={Theme.navy} onPress={() => go('password')} />
            </View>
          ) : null}

          {step === 'otp' ? (
            <View style={styles.stack18}>
              <View style={styles.between}>
                <AppText size="subheadline" weight="semibold">
                  أدخل الرمز
                </AppText>
                <PressableScale onPress={() => go('phone')} accessibilityLabel="تغيير الرقم">
                  <AppText size="footnote" weight="semibold" color={Theme.gold}>
                    تغيير الرقم
                  </AppText>
                </PressableScale>
              </View>
              <OTPField
                ref={otp}
                code={code}
                hasError={errorMessage != null}
                onChange={(next) => {
                  setCode(next);
                  setErrorMessage(null);
                  if (next.length === 6) verify(next);
                }}
              />
              <View style={styles.hint}>
                <Info size={13} color={Theme.muted} />
                <AppText size="caption" color={Theme.muted}>
                  {`للتجربة استخدم الرمز ${Fmt.digits(DEMO_CODE)}`}
                </AppText>
              </View>
              <PrimaryButton
                title="تأكيد الدخول"
                icon={Check}
                trailingIcon
                onPress={() => verify()}
                loading={isLoading}
                disabled={code.length < 6}
                dimmed={code.length < 6}
              />
              <View style={styles.resend}>
                <AppText size="footnote" color={Theme.muted}>
                  لم يصلك الرمز؟
                </AppText>
                {resendIn > 0 ? (
                  <AppText size="footnote">{`إعادة الإرسال بعد ${Fmt.digits(String(resendIn))} ث`}</AppText>
                ) : (
                  <PressableScale
                    accessibilityLabel="إعادة الإرسال"
                    onPress={() => {
                      Haptics.tap();
                      setCode('');
                      setResendIn(45);
                    }}
                  >
                    <AppText size="footnote" weight="semibold" color={Theme.gold}>
                      إعادة الإرسال
                    </AppText>
                  </PressableScale>
                )}
              </View>
            </View>
          ) : null}

          {step === 'password' ? (
            <View style={styles.stack16}>
              <AppText size="subheadline" weight="semibold">
                رقم الهاتف
              </AppText>
              <View style={[styles.field, styles.ltrRow]}>
                <AppText size="body" weight="semibold" color={Theme.muted}>
                  +964
                </AppText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="7XX XXX XXXX"
                  placeholderTextColor={withAlpha(Theme.muted, 0.7)}
                  keyboardType="phone-pad"
                  style={styles.inlineInput}
                  accessibilityLabel="رقم الهاتف"
                />
              </View>
              <AppText size="subheadline" weight="semibold">
                كلمة المرور
              </AppText>
              <View style={[styles.field, styles.row]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  placeholderTextColor={withAlpha(Theme.muted, 0.7)}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                  onSubmitEditing={loginWithPassword}
                  style={[styles.inlineInput, styles.passwordInput]}
                  accessibilityLabel="كلمة المرور"
                />
                <PressableScale
                  accessibilityLabel={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eye}
                >
                  {showPassword ? <EyeOff size={18} color={Theme.muted} /> : <Eye size={18} color={Theme.muted} />}
                </PressableScale>
              </View>
              <PrimaryButton title="تسجيل الدخول" icon={ArrowLeft} trailingIcon onPress={loginWithPassword} loading={isLoading} />
              <PressableScale onPress={() => go('phone')} accessibilityLabel="الدخول برمز التحقق OTP" style={styles.otpLink}>
                <MessageSquare size={14} color={Theme.gold} fill={Theme.gold} />
                <AppText size="footnote" weight="semibold" color={Theme.gold}>
                  الدخول برمز التحقق OTP
                </AppText>
              </PressableScale>
            </View>
          ) : null}

          {errorMessage != null ? (
            <View style={styles.error}>
              <CircleAlert size={15} color={Theme.white} fill={Theme.red} />
              <AppText size="footnote" weight="medium" color={Theme.red} style={styles.flex}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.hint}>
            <ShieldCheck size={15} color={Theme.green} fill={withAlpha(Theme.green, 0.2)} />
            <AppText size="footnote" weight="medium" color={Theme.muted}>
              بياناتك محمية ومشفّرة
            </AppText>
          </View>
          <AppText size="caption" color={withAlpha(Theme.muted, 0.8)} align="center">
            يتم تحديد نوع الحساب تلقائياً بعد تسجيل الدخول
          </AppText>
        </View>
      </ScrollView>

      {session.phase === 'resolvingAccount' ? <ResolvingAccountOverlay /> : null}
    </View>
  );
}

/** Shown while the backend resolves the account type after authentication. */
function ResolvingAccountOverlay() {
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin, fade]);

  const r = 41;
  const c = 2 * Math.PI * r;
  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <View style={styles.spinner}>
        <Svg width={86} height={86} style={StyleSheet.absoluteFill}>
          <Circle cx={43} cy={43} r={r} stroke={withAlpha(Theme.white, 0.1)} strokeWidth={4} fill="none" />
        </Svg>
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}
        >
          <Svg width={86} height={86}>
            <Defs>
              <SvgGradient id="gold" x1="1" y1="0" x2="0" y2="0">
                <Stop offset="0" stopColor={Theme.goldLight} />
                <Stop offset="1" stopColor={Theme.gold} />
              </SvgGradient>
            </Defs>
            <Circle
              cx={43}
              cy={43}
              r={r}
              stroke="url(#gold)"
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${c * 0.3} ${c}`}
            />
          </Svg>
        </Animated.View>
        <UserCheck size={30} color={Theme.goldLight} />
      </View>
      <AppText size="headline" weight="semibold" color={Theme.white} align="center">
        جارٍ تحديد نوع الحساب…
      </AppText>
      <AppText size="footnote" color={withAlpha(Theme.white, 0.6)} align="center">
        حساب ولي أمر ← واجهة ولي الأمر
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.canvas },
  headerBg: { position: 'absolute', top: 0, start: 0, end: 0, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30, gap: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { alignItems: 'center', gap: 6, paddingBottom: 4 },
  logo: { paddingTop: 18, paddingBottom: 12 },
  form: { ...card(20, 26), gap: 18 },
  stack18: { gap: 18 },
  stack16: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ltrRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefix: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 54,
    borderRadius: 14,
    backgroundColor: Theme.canvas,
  },
  phoneInput: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    backgroundColor: Theme.canvas,
    color: Theme.ink,
    fontFamily: Fonts.semibold,
    fontSize: 20,
    textAlign: LTR_ALIGN,
    writingDirection: 'ltr',
  },
  field: { height: 52, borderRadius: 14, paddingHorizontal: 14, backgroundColor: Theme.canvas, gap: 8 },
  inlineInput: { flex: 1, height: 52, color: Theme.ink, fontFamily: Fonts.semibold, fontSize: 17, textAlign: LTR_ALIGN, writingDirection: 'ltr' },
  passwordInput: { textAlign: Platform.OS === 'web' ? 'right' : 'left', writingDirection: 'rtl' },
  eye: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: Theme.line },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  resend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  otpLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 36 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: Theme.redSoft },
  flex: { flex: 1 },
  footer: { alignItems: 'center', gap: 6 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(Theme.navy, 0.92),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  spinner: { width: 86, height: 86, alignItems: 'center', justifyContent: 'center' },
});
