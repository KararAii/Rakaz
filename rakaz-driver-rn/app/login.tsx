import { CircleAlert, Lock, Phone, Shield, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { rakazLogo } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Fonts, Rakaz, withAlpha } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';

interface LoginFieldProps {
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType: KeyboardTypeOptions;
  maxLength: number;
  secure?: boolean;
  onSubmit?: () => void;
}

function LoginField({ icon: Icon, placeholder, value, onChange, keyboardType, maxLength, secure = false, onSubmit }: LoginFieldProps) {
  return (
    <View style={styles.field}>
      <Icon color={Rakaz.Gold} size={20} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={withAlpha(Rakaz.White, 0.4)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secure}
        selectionColor={Rakaz.Gold}
        cursorColor={Rakaz.Gold}
        returnKeyType={onSubmit ? 'go' : 'next'}
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

/** Decorative navy backdrop: gold glow, deep-blue glow and faint gold arcs. */
function Backdrop() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="gold" cx={width * 0.9} cy={height * 0.1} r={width * 0.8} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={Rakaz.Gold} stopOpacity={0.22} />
          <Stop offset="1" stopColor={Rakaz.Gold} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="blue" cx={0} cy={height * 0.85} r={width} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1D3A63" stopOpacity={0.8} />
          <Stop offset="1" stopColor="#1D3A63" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={Rakaz.Navy} />
      <Rect x={0} y={0} width={width} height={height} fill="url(#gold)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#blue)" />
      {[0, 1, 2, 3, 4].map((i) => {
        const rx = (width * 1.6 + i * 80) / 2;
        const ry = (height * 0.5) / 2;
        const cx = -width * 0.3 - i * 40 + rx;
        const cy = height * 0.62 + i * 30 + ry;
        const start = (200 * Math.PI) / 180;
        const end = (320 * Math.PI) / 180;
        const x1 = cx + rx * Math.cos(start);
        const y1 = cy + ry * Math.sin(start);
        const x2 = cx + rx * Math.cos(end);
        const y2 = cy + ry * Math.sin(end);
        return (
          <Path
            key={i}
            d={`M${x1},${y1} A${rx},${ry} 0 0 1 ${x2},${y2}`}
            stroke={Rakaz.Gold}
            strokeOpacity={0.07 - i * 0.01}
            strokeWidth={1.5}
            fill="none"
          />
        );
      })}
    </Svg>
  );
}

export default function LoginScreen() {
  const { login } = useDriverStore();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appear = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const errorFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(appear, { toValue: 1, damping: 9, stiffness: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
    ]).start();
  }, [appear, fade]);

  useEffect(() => {
    if (error) {
      errorFade.setValue(0);
      Animated.timing(errorFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [error, errorFade]);

  const submit = () => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    void login(phone, code).then((message) => {
      setError(message);
      setLoading(false);
    });
  };

  return (
    <View style={styles.root}>
      <Backdrop />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 30 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.logoCard, { opacity: fade, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
            <Image source={rakazLogo} resizeMode="contain" style={styles.logo} accessibilityLabel="ركاز" />
          </Animated.View>

          <Animated.View style={[styles.titles, { opacity: fade }]}>
            <AppText variant="displaySmall" color={Rakaz.White} style={styles.center}>
              تطبيق السائق
            </AppText>
            <AppText variant="titleMedium" color={Rakaz.Gold} style={styles.center}>
              نقل وتوصيل الطلاب بأمان
            </AppText>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fade }]}>
            <LoginField icon={Phone} placeholder="رقم الهاتف" value={phone} onChange={setPhone} keyboardType="phone-pad" maxLength={14} />
            <LoginField
              icon={Lock}
              placeholder="رمز الدخول"
              value={code}
              onChange={setCode}
              keyboardType="number-pad"
              maxLength={8}
              secure
              onSubmit={submit}
            />
            {error ? (
              <Animated.View style={[styles.error, { opacity: errorFade }]}>
                <CircleAlert color={Rakaz.LoginError} size={18} />
                <AppText variant="labelMedium" color={Rakaz.LoginError}>
                  {error}
                </AppText>
              </Animated.View>
            ) : null}
            <PressableScale onPress={submit} disabled={loading} accessibilityLabel="تسجيل الدخول" style={styles.submit}>
              {loading ? (
                <ActivityIndicator color={Rakaz.Ink} />
              ) : (
                <AppText variant="labelLarge" color={Rakaz.Ink}>
                  تسجيل الدخول
                </AppText>
              )}
            </PressableScale>
            <PressableScale
              onPress={() => {
                setPhone('07701234567');
                setCode('2040');
              }}
              accessibilityLabel="تعبئة بيانات تجريبية"
              style={styles.demo}
            >
              <AppText variant="labelMedium" color={withAlpha(Rakaz.White, 0.6)}>
                تعبئة بيانات تجريبية
              </AppText>
            </PressableScale>
            <View style={styles.note}>
              <Shield color={withAlpha(Rakaz.White, 0.45)} size={14} />
              <AppText variant="bodySmall" color={withAlpha(Rakaz.White, 0.45)}>
                الحساب يُنشأ من قبل إدارة النقل
              </AppText>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Rakaz.Navy },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 22, alignItems: 'center' },
  logoCard: {
    borderRadius: 28,
    backgroundColor: Rakaz.White,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  logo: { width: 190, height: 130 },
  titles: { marginTop: 28, alignItems: 'center' },
  form: {
    marginTop: 28,
    alignSelf: 'stretch',
    borderRadius: 26,
    backgroundColor: withAlpha(Rakaz.White, 0.06),
    borderWidth: 1,
    borderColor: withAlpha(Rakaz.White, 0.1),
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
  field: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 16,
    backgroundColor: withAlpha(Rakaz.White, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Rakaz.White, 0.12),
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Rakaz.White,
    fontFamily: Fonts.medium,
    fontSize: 17,
    textAlign: Platform.OS === 'web' ? 'right' : 'left',
  },
  error: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 6 },
  submit: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 18,
    backgroundColor: Rakaz.Gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Rakaz.Gold,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  demo: { minHeight: 44, paddingTop: 12, justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
