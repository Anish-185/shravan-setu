// One screening round: pie chart of PASS / RETEST / REFER and every child screened, tap a slice to filter. Adapted from
// DhwaniSarathi audiometer/app/Screens/Educator/AssignmentAnalytics.js (Apache-2.0, the DhwaniSarathi team). Changed
// by us: the hearing-loss categories (Normal / Mild / Moderate / Severe / Profound from a pure-tone average) are
// replaced by our screening outcome, because our app screens at one fixed level and measures no thresholds; data from
// this phone instead of /assignments/<AID>/userassignmentresults/; VictoryPie → our react-native-svg Pie; card shows
// age band (no gender); our design system. Screening only, never a diagnosis.
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db';
import { get } from '@/db/store';
import { useT } from '@/i18n';
import { Icon } from '@/icons';
import { roundResults, type Assignment } from '@/teacher/data';
import { Pie } from '@/teacher/Pie';
import { C, Card, F, H, OUTCOME, Pill, s } from '@/ui';

// Was hearingCategories (PTA ranges); now our outcomes, in the same role.
const hearingCategories = ['PASS', 'RETEST', 'REFER'] as const;
type Category = (typeof hearingCategories)[number];
const getCategory = (outcome: string | null): Category => (outcome === 'PASS' || outcome === 'REFER' ? outcome : 'RETEST');

const AssignmentAnalytics = () => {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignment = get<Assignment>(db, 'assignment', id);
  const load = useCallback(() => {
    const a = get<Assignment>(db, 'assignment', id);
    return a ? roundResults(a) : [];
  }, [id]);
  const [listUserCard, setListUserCard] = useState(load);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  useFocusEffect(useCallback(() => setListUserCard(load()), [load]));

  const data3 = hearingCategories.map((category) => ({
    x: category,
    y: listUserCard.filter((e) => getCategory(e.result.outcome) === category).length,
  }));
  // Remove categories with no data
  const filterData = data3.filter((item) => item.y !== 0);
  const totalStudents = data3.reduce((total, d) => total + d.y, 0);
  const colorScale = filterData.map((point) => OUTCOME[point.x].fill);

  const handleCategoryClick = (category: string) =>
    setSelectedCategory(category === selectedCategory ? null : (category as Category));

  const searchFilter = (item: (typeof listUserCard)[number]) =>
    selectedCategory ? getCategory(item.result.outcome) === selectedCategory : true;

  const renderAssignmentCard = (item: (typeof listUserCard)[number]) => {
    const o = OUTCOME[getCategory(item.result.outcome)];
    return (
      <Card key={item.sessionId} style={{ padding: 0 }}>
        <Link href={{ pathname: '/teacher/result/[sessionId]', params: { sessionId: item.sessionId } }} asChild>
          <Pressable style={st.card}>
            <View style={st.titleRow}>
              <Text style={st.cardTitle}>{item.child.display_name}</Text>
              <Pill icon={o.icon} text={getCategory(item.result.outcome)} tint={o.tint} color={o.onTint} />
            </View>
            <Text style={s.muted}>{t('teacher.age', { age: item.child.age_band })}</Text>
            <View style={st.more}>
              <Text style={st.cardMore}>{t('teacher.moreDetails')}</Text>
              <Icon name="chevron-right" size={18} color={C.indigo} />
            </View>
          </Pressable>
        </Link>
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <H>{assignment?.name ?? '-'}</H>
      {totalStudents === 0 ? <Text style={s.muted}>{t('teacher.noResults')}</Text> : (
        <Card style={st.chartContainer}>
          <Pie data={filterData} colorScale={colorScale} outerRadius={100} innerRadius={45} onPressSlice={handleCategoryClick} />
          <View style={st.labels}>
            {filterData.map((point) => (
              <Pressable key={point.x} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === point.x }}
                onPress={() => handleCategoryClick(point.x)}
                style={[st.label, selectedCategory === point.x && { borderColor: OUTCOME[point.x].fill }]}>
                <Pill icon={OUTCOME[point.x].icon} text={point.x} tint={OUTCOME[point.x].tint} color={OUTCOME[point.x].onTint} />
                <Text style={st.pct}>{`${point.y} (${((point.y / totalStudents) * 100).toFixed(0)}%)`}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.muted, { textAlign: 'center' }]}>{t('teacher.pieHint')}</Text>
        </Card>
      )}
      {listUserCard.filter(searchFilter).map(renderAssignmentCard)}
    </ScrollView>
  );
};

const st = StyleSheet.create({
  chartContainer: { alignItems: 'center' },
  labels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  label: { alignItems: 'center', gap: 2, padding: 6, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  pct: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  card: { padding: 16, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, color: C.night, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  cardMore: { color: C.indigo, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
});

export default AssignmentAnalytics;
