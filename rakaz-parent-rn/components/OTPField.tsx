import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Theme } from '@/constants/theme';
import { Fmt } from '@/utils/fmt';

export interface OTPFieldHandle {
  focus: () => void;
}

export interface OTPFieldProps {
  code: string;
  onChange: (code: string) => void;
  hasError: boolean;
}

/** Six-box OTP input backed by a single hidden text field (always laid out left-to-right). */
export const OTPField = forwardRef<OTPFieldHandle, OTPFieldProps>(function OTPField({ code, onChange, hasError }, ref) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);
  const chars = code.split('');

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="رمز التحقق">
      <TextInput
        ref={input}
        value={code}
        onChangeText={(v) => onChange(Fmt.latinDigits(v).replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
        caretHidden
      />
      <View style={styles.row} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const char = chars[i] ?? '';
          const active = i === chars.length && focused;
          const borderColor = hasError ? Theme.red : active ? Theme.gold : 'transparent';
          return (
            <View
              key={i}
              style={[
                styles.box,
                { backgroundColor: char.length === 0 ? Theme.canvas : Theme.goldSoft, borderColor, transform: [{ scale: char.length === 0 ? 1 : 1.03 }] },
              ]}
            >
              <AppText size={24} weight="bold" align="center">
                {Fmt.digits(char)}
              </AppText>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  hidden: { position: 'absolute', opacity: 0.02, width: '100%', height: '100%', color: 'transparent' },
  row: { flexDirection: 'row-reverse', gap: 8 },
  box: { flex: 1, height: 56, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
