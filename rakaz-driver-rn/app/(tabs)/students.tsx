import { router } from 'expo-router';
import { ChevronLeft, Search, Sun } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyNote, InitialsAvatar, StatusBadge } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Fonts, Rakaz, card, withAlpha } from '@/constants/theme';
import { findStudent } from '@/store/driverState';
import { useDriverStore } from '@/store/driverStore';
import { type RouteStop, type Student, TripLeg, emptyStopRecord, studentInitials } from '@/types/models';
import { ArabicFormat, arabicDigits } from '@/utils/arabicFormat';

export default function StudentsScreen() {
  const { state, derived } = useDriverStore();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim();
    return state.route.stops
      .map((stop) => {
        const student = findStudent(state, stop.studentId);
        return student ? { student, stop } : null;
      })
      .filter((row): row is { student: Student; stop: RouteStop } => row != null)
      .filter(({ student }) => q.length === 0 || student.name.includes(q) || student.area.includes(q));
  }, [state, query]);

  const records = derived.currentLeg === TripLeg.MORNING ? state.trip.morning : state.trip.afternoon;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <AppText variant="headlineSmall" color={Rakaz.White}>
          الطلاب
        </AppText>
        <AppText variant="labelMedium" color={Rakaz.Gold}>
          {`${ArabicFormat.number(state.route.students.length)} طلاب · مسار ${state.route.code}`}
        </AppText>
        <View style={styles.search}>
          <Search color={Rakaz.Gold} size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث بالاسم أو المنطقة"
            placeholderTextColor={withAlpha(Rakaz.White, 0.45)}
            selectionColor={Rakaz.Gold}
            cursorColor={Rakaz.Gold}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="ابحث بالاسم أو المنطقة"
          />
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.student.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyNote text="لا توجد نتائج" />}
        renderItem={({ item: { student, stop } }) => {
          const record = records[student.id] ?? emptyStopRecord();
          return (
            <PressableScale
              haptic={false}
              onPress={() => router.push({ pathname: '/student/[id]', params: { id: student.id } })}
              accessibilityLabel={student.name}
              style={[card(20), styles.row]}
            >
              <InitialsAvatar initials={studentInitials(student)} size={48} corner={14} />
              <View style={[styles.flex, styles.rowText]}>
                <AppText variant="titleSmall">{student.name}</AppText>
                <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
                  {`${student.grade} · ${student.area}`}
                </AppText>
                <View style={styles.inline}>
                  <Sun color={Rakaz.Gold} size={13} />
                  <AppText variant="labelSmall" color={Rakaz.InkSecondary}>
                    {`الصعود ${arabicDigits(stop.pickupTime)}`}
                  </AppText>
                </View>
              </View>
              <StatusBadge status={record.status} />
              <ChevronLeft color={Rakaz.InkSecondary} size={22} />
            </PressableScale>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Rakaz.Canvas },
  flex: { flex: 1 },
  header: { backgroundColor: Rakaz.Navy, paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  search: {
    height: 48,
    borderRadius: 14,
    backgroundColor: withAlpha(Rakaz.White, 0.1),
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: Rakaz.White,
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: Platform.OS === 'web' ? 'right' : 'left',
  },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowText: { gap: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
