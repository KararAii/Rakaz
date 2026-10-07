import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Banknote, BadgeCheck, Calendar, Hash, NotebookPen, Share2, ShieldCheck } from 'lucide-react-native';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/DetailScreen';
import { InfoRow, RowDivider } from '@/components/Primitives';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PaymentMethodIcon } from '@/constants/visuals';
import { card, Theme } from '@/constants/theme';
import { useFamily } from '@/store/familyStore';
import { type Payment, PaymentMethodTitle } from '@/types/models';
import { showAlert } from '@/utils/dialog';
import { Fmt } from '@/utils/fmt';

function receiptText(p: Payment): string {
  return [
    'إيصال دفع — ركاز للنقل',
    `رقم العملية: ${p.id}`,
    `المبلغ: ${Fmt.money(p.amount)}`,
    `التاريخ: ${Fmt.date(p.date)}`,
    `طريقة الدفع: ${PaymentMethodTitle[p.method]}`,
    `سجّلها: ${p.recordedBy}`,
  ].join('\n');
}

async function shareReceipt(p: Payment): Promise<void> {
  const message = receiptText(p);
  if (Platform.OS === 'web' && typeof navigator.share !== 'function') {
    await Clipboard.setStringAsync(message);
    showAlert('مشاركة الإيصال', 'تم نسخ الإيصال إلى الحافظة.');
    return;
  }
  await Share.share({ message }).catch(() => undefined);
}

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useFamily();
  const insets = useSafeAreaInsets();
  const payment = store.payments.find((p) => p.id === id);

  return (
    <View style={styles.root}>
      {Platform.OS === 'ios' ? null : <ScreenHeader title="تفاصيل الدفعة" />}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        {payment == null ? (
          <EmptyState icon={Banknote} title="العملية غير موجودة" />
        ) : (
          <>
            <View style={styles.hero}>
              <BadgeCheck size={46} color={Theme.white} fill={Theme.green} strokeWidth={1.8} />
              <AppText size={34} weight="bold" align="center">
                {Fmt.money(payment.amount)}
              </AppText>
              <AppText size="subheadline" color={Theme.muted} align="center">
                عملية دفع مسجّلة
              </AppText>
            </View>
            <View style={card(14)}>
              <InfoRow icon={Hash} label="رقم العملية" value={payment.id} mono copyable />
              <RowDivider />
              <InfoRow icon={Banknote} label="المبلغ" value={Fmt.money(payment.amount)} />
              <RowDivider />
              <InfoRow icon={Calendar} label="التاريخ" value={`${Fmt.date(payment.date)} — ${Fmt.time(payment.date)}`} />
              <RowDivider />
              <InfoRow icon={PaymentMethodIcon[payment.method]} label="طريقة الدفع" value={PaymentMethodTitle[payment.method]} />
              <RowDivider />
              <InfoRow icon={ShieldCheck} label="الموظف الذي سجّل العملية" value={payment.recordedBy} />
              <RowDivider />
              <InfoRow icon={NotebookPen} label="ملاحظات" value={payment.note.length === 0 ? 'لا توجد ملاحظات' : payment.note} />
            </View>
            <PrimaryButton title="مشاركة الإيصال" icon={Share2} onPress={() => void shareReceipt(payment)} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.canvas },
  content: { paddingHorizontal: 16, gap: 18, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 8, paddingTop: 24 },
});
