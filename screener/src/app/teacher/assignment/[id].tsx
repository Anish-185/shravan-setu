// Assignment analytics: donut chart of the class, tap a slice to filter, colour-coded child cards with "More
// Details". Copied from DhwaniSarathi audiometer/app/Screens/Educator/AssignmentAnalytics.js (Apache-2.0, the
// DhwaniSarathi team), with its VictoryPie and colours. Changed by us: data from this phone instead of
// /assignments/<AID>/userassignmentresults/; a child with a detailed test is placed by the estimated grade of the
// worse ear (config hearing_grades, WHO 2021, six grades; theirs had five with different edges), a child with only a
// screening by PASS / RETEST / REFER; a legend lists both, with counts, and filters too; their VictoryLabel loop
// (drawn at one spot) → slice labels with percentages; card shows age band (no gender: we record none); "More Details"
// opens the detailed results or the screening result.
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VictoryPie } from 'victory-native';

import { cfg } from '@/config';
import { db } from '@/db';
import { get } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { GRADE_COLOR, grades, onGrade } from '@/original/hearing';
import { DS } from '@/original/paper';
import { roundResults, type Assignment } from '@/teacher/data';
import { OUTCOME } from '@/ui';

const AssignmentAnalytics = () => {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignment = get<Assignment>(db, 'assignment', id);
  const load = useCallback(() => {
    const a = get<Assignment>(db, 'assignment', id);
    return a ? roundResults(a) : [];
  }, [id]);
  const [listUserCard, setListUserCard] = useState(load);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  useFocusEffect(useCallback(() => setListUserCard(load()), [load]));

  type Row = (typeof listUserCard)[number];
  // Estimated grade (detailed test) first, else the screening outcome.
  const getCategory = (item: Row) => item.detailed?.grade ?? item.result?.outcome ?? 'RETEST';
  const hearingCategories = [...grades(cfg).map((g) => g.grade), 'PASS', 'RETEST', 'REFER'];
  const isGrade = (c: string) => c in GRADE_COLOR;
  const hearingCategoryColors = (c: string) => (isGrade(c) ? GRADE_COLOR[c] : OUTCOME[c as keyof typeof OUTCOME].fill);
  const textOn = (c: string) => (isGrade(c) ? onGrade(c) : OUTCOME[c as keyof typeof OUTCOME].on);
  const name = (c: string) => (isGrade(c) ? t(`ds.grade.${c}` as Key) : c);

  const data3 = hearingCategories.map((category) => ({ x: category, y: listUserCard.filter((e) => getCategory(e) === category).length }));
  // Remove categories with no data
  const filterData = data3.filter((item) => item.y !== 0);
  const totalStudents = data3.reduce((total, d) => total + d.y, 0);
  const colorScale = filterData.map((point) => hearingCategoryColors(point.x));
  const handleCategoryClick = (category: string) => setSelectedCategory((prev) => (prev === category ? null : category));
  const searchFilter = (item: Row) => (selectedCategory ? getCategory(item) === selectedCategory : true);

  const renderAssignmentCard = (item: Row) => {
    const c = getCategory(item);
    const href = item.detailed
      ? { pathname: '/results/[testId]' as const, params: { testId: item.detailed.id } }
      : { pathname: '/teacher/result/[sessionId]' as const, params: { sessionId: item.sessionId! } };
    return (
      <Link key={item.child.id} href={href} asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={[styles.cardTitle, { backgroundColor: hearingCategoryColors(c), color: textOn(c) }]}>
            {item.child.display_name} · {name(c)}{isGrade(c) ? ` (${t('ds.estimated')})` : ''}
          </Text>
          <Text style={styles.cardDate}>{t('teacher.age', { age: item.child.age_band })}</Text>
          {item.detailed && item.result?.outcome && <Text style={styles.cardDate}>{t('ds.screeningWas', { outcome: item.result.outcome })}</Text>}
          <Text style={styles.cardMore}>{t('teacher.moreDetails')}</Text>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{assignment?.name ?? t('ds.analytics')}</Text>
      {totalStudents === 0 ? <Text style={styles.empty}>{t('teacher.noResults')}</Text> : (
        <View style={styles.chartContainer}>
          <VictoryPie
            height={250}
            data={filterData}
            radius={100}
            innerRadius={45}
            colorScale={colorScale}
            labels={({ datum }) => `${((datum.y / totalStudents) * 100).toFixed(0)}%`}
            labelRadius={112}
            style={{ labels: { fill: DS.navy, fontSize: 16, fontWeight: 'bold' } }}
            events={[{
              target: 'data',
              eventHandlers: {
                onPressIn: () => [{ target: 'data', mutation: ({ datum }: { datum: { x: string } }) => { handleCategoryClick(datum.x); return null; } }],
              },
            }]}
          />
          <View style={styles.legend}>
            {filterData.map((point) => (
              <Pressable key={point.x} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === point.x }}
                onPress={() => handleCategoryClick(point.x)}
                style={[styles.legendItem, selectedCategory === point.x && { borderColor: DS.navy }]}>
                <View style={[styles.legendBox, { backgroundColor: hearingCategoryColors(point.x) }]} />
                <Text style={styles.legendText}>
                  {name(point.x)}{isGrade(point.x) ? '*' : ''} {point.y} ({((point.y / totalStudents) * 100).toFixed(0)}%)
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.note}>{t('ds.legendNote')}</Text>
        </View>
      )}
      {listUserCard.filter(searchFilter).map(renderAssignmentCard)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingLeft: 5, paddingRight: 5, paddingBottom: 24, backgroundColor: 'white', flexGrow: 1 },
  chartContainer: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: 'white', backgroundColor: DS.red, padding: 8, textAlign: 'center' },
  empty: { textAlign: 'center', color: 'grey', margin: 20 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginHorizontal: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  legendBox: { width: 18, height: 18, borderRadius: 3 },
  legendText: { fontSize: 14, color: DS.navy },
  note: { fontSize: 12, color: 'grey', margin: 8, textAlign: 'center' },
  card: {
    marginBottom: 20, paddingBottom: 10, borderRadius: 5, marginHorizontal: 10, borderWidth: 1, backgroundColor: 'white',
    borderColor: 'white', elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 5, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  cardDate: { color: 'black', paddingHorizontal: 10, paddingVertical: 5 },
  cardMore: { color: 'black', fontWeight: 'bold', textAlign: 'right', paddingHorizontal: 10 },
});

export default AssignmentAnalytics;
