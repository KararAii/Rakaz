import { Ambulance, CarFront, Hourglass, Phone, Radio, TriangleAlert, Wrench, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { BrandButton } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz, Type } from '@/constants/theme';

const types: { title: string; icon: LucideIcon }[] = [
  { title: 'عطل في الحافلة', icon: Wrench },
  { title: 'حادث مروري', icon: CarFront },
  { title: 'حالة صحية لطالب', icon: Ambulance },
  { title: 'تأخير كبير', icon: Hourglass },
];

export interface EmergencySheetProps {
  visible: boolean;
  adminPhone: string | null;
  onDismiss: () => void;
  onSend: (type: string, note: string) => void;
  onCall: (phone: string) => void;
}

export function EmergencySheet({ visible, adminPhone, onDismiss, onSend, onCall }: EmergencySheetProps) {
  const [type, setType] = useState(types[0]?.title ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setType(types[0]?.title ?? '');
      setNote('');
    }
  }, [visible]);

  const rows = [types.slice(0, 2), types.slice(2, 4)];

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <TriangleAlert color={Rakaz.White} size={24} />
        </View>
        <View style={styles.flex}>
          <AppText variant="titleLarge">حالة طارئة</AppText>
          <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
            سيتم إبلاغ الإدارة فوراً مع موقعك الحالي
          </AppText>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.typeRow}>
          {row.map(({ title, icon: Icon }) => {
            const selected = title === type;
            return (
              <PressableScale
                key={title}
                onPress={() => setType(title)}
                accessibilityLabel={title}
                style={[
                  styles.type,
                  {
                    backgroundColor: selected ? Rakaz.RedSoft : Rakaz.Canvas,
                    borderColor: selected ? Rakaz.RedLine : 'transparent',
                  },
                ]}
              >
                <Icon color={selected ? Rakaz.Red : Rakaz.Ink} size={24} />
                <AppText variant="labelMedium" color={selected ? Rakaz.Red : Rakaz.Ink} style={styles.center}>
                  {title}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
      ))}
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="ملاحظة (اختياري)"
        placeholderTextColor={Rakaz.InkSecondary}
        multiline
        selectionColor={Rakaz.Red}
        style={styles.note}
      />
      <BrandButton title="إرسال بلاغ طوارئ" icon={Radio} kind="DANGER" onPress={() => onSend(type, note)} />
      {adminPhone ? <BrandButton title="اتصال مباشر بالإدارة" icon={Phone} kind="OUTLINE" onPress={() => onCall(adminPhone)} /> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Rakaz.Red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  type: {
    flex: 1,
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  note: {
    ...Type.bodyLarge,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: Rakaz.Canvas,
    padding: 14,
    color: Rakaz.Ink,
    textAlign: Platform.OS === 'web' ? 'right' : 'left',
    textAlignVertical: 'top',
  },
});
