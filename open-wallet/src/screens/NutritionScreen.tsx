import { fonts } from '../utils/theme';
/**
 * Nutrition Screen — Nutrition tracking, meal planning, dietary education.
 *
 * Article I: "Good nutrition is fundamental to human wellbeing."
 * Article III: hOTK represents health value; eOTK for teaching cooking classes.
 *
 * Features:
 * - Daily nutrition log (meals, calories, macros approximate)
 * - Meal plan suggestions (based on local available produce from FarmToTable)
 * - Nutrition education (balanced diet guides, regional food pyramids)
 * - Special diets community (vegetarian, vegan, allergies, cultural dietary needs)
 * - Community cooking classes (schedule, join, teach — earn eOTK)
 * - Nutrition score (0-100 based on diet diversity and consistency)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface MealEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface MealPlan {
  id: string;
  title: string;
  source: string;
  meals: string[];
  estimatedCalories: number;
  localProduce: string[];
  season: string;
}

interface DietGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  readTime: string;
}

interface CookingClass {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  cuisine: string;
  spotsLeft: number;
  eotkReward: number;
  isTeaching: boolean;
}

interface NutritionScore {
  overall: number;
  diversity: number;
  consistency: number;
  balance: number;
  streak: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: 'B' },
  { key: 'lunch', label: 'Lunch', icon: 'L' },
  { key: 'dinner', label: 'Dinner', icon: 'D' },
  { key: 'snack', label: 'Snack', icon: 'S' },
];

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: '#FF9500',
  lunch: '#34C759',
  dinner: '#007AFF',
  snack: '#AF52DE',
};

// ─── Demo Data ───

const DEMO_MEALS: MealEntry[] = [
  { id: 'm1', mealType: 'breakfast', name: 'Oatmeal with berries and walnuts', calories: 380, protein: 12, carbs: 58, fat: 14, time: '7:30 AM' },
  { id: 'm2', mealType: 'lunch', name: 'Grilled chicken salad with quinoa', calories: 520, protein: 38, carbs: 42, fat: 18, time: '12:15 PM' },
  { id: 'm3', mealType: 'dinner', name: 'Lentil soup with whole wheat bread', calories: 450, protein: 22, carbs: 64, fat: 8, time: '7:00 PM' },
];

const DEMO_SCORE: NutritionScore = {
  overall: 72,
  diversity: 68,
  consistency: 78,
  balance: 70,
  streak: 5,
};

const DEMO_PLANS: MealPlan[] = [
  {
    id: 'p1', title: 'Spring Local Harvest Plan', source: 'FarmToTable Co-op',
    meals: ['Spinach egg scramble', 'Asparagus lentil bowl', 'Herb-roasted chicken with spring peas'],
    estimatedCalories: 1650, localProduce: ['Spinach', 'Asparagus', 'Peas', 'Herbs'], season: 'Spring',
  },
  {
    id: 'p2', title: 'Budget-Friendly Weekly Plan', source: 'Community Nutritionist',
    meals: ['Rice porridge with banana', 'Bean and vegetable wrap', 'Sweet potato and chickpea curry'],
    estimatedCalories: 1500, localProduce: ['Sweet potato', 'Beans', 'Banana', 'Chickpeas'], season: 'All Year',
  },
  {
    id: 'p3', title: 'High-Protein Plant Plan', source: 'FarmToTable Co-op',
    meals: ['Tofu scramble with peppers', 'Edamame grain bowl', 'Black bean tacos with avocado'],
    estimatedCalories: 1700, localProduce: ['Peppers', 'Edamame', 'Black beans', 'Avocado'], season: 'Summer',
  },
];

const DEMO_GUIDES: DietGuide[] = [
  { id: 'g1', title: 'Building a Balanced Plate', category: 'Basics', summary: 'The 50-25-25 framework: half vegetables, quarter protein, quarter grains.', readTime: '3 min' },
  { id: 'g2', title: 'Regional Food Pyramid: South Asia', category: 'Regional', summary: 'Adapting the food pyramid for traditional South Asian diets rich in lentils, rice, and spices.', readTime: '5 min' },
  { id: 'g3', title: 'Navigating Food Allergies in Community', category: 'Special Diets', summary: 'How to participate in community meals safely with common allergies and intolerances.', readTime: '4 min' },
];

const DEMO_CLASSES: CookingClass[] = [
  { id: 'cl1', title: 'Farm-Fresh Spring Salads', instructor: 'openchain1abc...chef_amara', date: '2026-04-05', time: '10:00 AM', cuisine: 'Mediterranean', spotsLeft: 8, eotkReward: 300, isTeaching: false },
  { id: 'cl2', title: 'Budget Meals from Scratch', instructor: 'you', date: '2026-04-12', time: '2:00 PM', cuisine: 'Global', spotsLeft: 12, eotkReward: 500, isTeaching: true },
];

type Tab = 'log' | 'plan' | 'learn' | 'community';

export function NutritionScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('log');
  const [logMealType, setLogMealType] = useState('');
  const [logName, setLogName] = useState('');
  const [logCalories, setLogCalories] = useState('');
  const [logProtein, setLogProtein] = useState('');
  const [logCarbs, setLogCarbs] = useState('');
  const [logFat, setLogFat] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const totalCalories = useMemo(() => DEMO_MEALS.reduce((sum, m) => sum + m.calories, 0), []);
  const totalProtein = useMemo(() => DEMO_MEALS.reduce((sum, m) => sum + m.protein, 0), []);
  const totalCarbs = useMemo(() => DEMO_MEALS.reduce((sum, m) => sum + m.carbs, 0), []);
  const totalFat = useMemo(() => DEMO_MEALS.reduce((sum, m) => sum + m.fat, 0), []);

  const handleLogMeal = useCallback(() => {
    if (!logMealType) { Alert.alert('Required', 'Select a meal type.'); return; }
    if (!logName.trim()) { Alert.alert('Required', 'Enter meal name.'); return; }
    const cal = parseInt(logCalories, 10);
    if (!cal || cal <= 0) { Alert.alert('Required', 'Enter approximate calories.'); return; }

    Alert.alert(
      'Meal Logged',
      `${logMealType}: ${logName}\n${cal} cal\n\nYour nutrition score will update.`,
    );
    setLogMealType('');
    setLogName('');
    setLogCalories('');
    setLogProtein('');
    setLogCarbs('');
    setLogFat('');
  }, [logMealType, logName, logCalories]);

  const scoreColor = (score: number) => {
    if (score >= 80) return t.accent.green;
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    scoreCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    scoreNumber: { fontSize: 56, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    scoreDetails: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    scoreItem: { alignItems: 'center' },
    scoreItemValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold },
    scoreItemLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    streakBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    streakText: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.bold },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    mealIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    mealIconText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    mealInfo: { flex: 1 },
    mealName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    mealMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    mealCalories: { alignItems: 'flex-end' },
    mealCalText: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    mealCalLabel: { color: t.text.muted, fontSize: 10 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    planCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    planTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    planSource: { color: t.accent.blue, fontSize: 12, marginTop: 2 },
    planMeals: { marginTop: 10 },
    planMealItem: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    planCalories: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    planProduce: { color: t.accent.green, fontSize: 11 },
    planUseBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    planUseBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guideCategory: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    guideTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    guideSummary: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    guideRead: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 8 },
    classCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    classTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    classMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    classFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    classEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    classJoinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    classJoinText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    teachingBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    teachingText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabsList: Array<{ key: Tab; label: string }> = [
    { key: 'log', label: 'Log' },
    { key: 'plan', label: 'Plan' },
    { key: 'learn', label: 'Learn' },
    { key: 'community', label: 'Community' },
  ];

  // ─── Log Tab ───

  const renderLog = () => (
    <>
      {/* Nutrition Score */}
      <View style={s.scoreCard}>
        <Text style={s.scoreLabel}>Nutrition Score</Text>
        <Text style={[s.scoreNumber, { color: scoreColor(DEMO_SCORE.overall) }]}>
          {DEMO_SCORE.overall}
        </Text>
        <View style={s.scoreDetails}>
          <View style={s.scoreItem}>
            <Text style={s.scoreItemValue}>{DEMO_SCORE.diversity}</Text>
            <Text style={s.scoreItemLabel}>Diversity</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={s.scoreItemValue}>{DEMO_SCORE.consistency}</Text>
            <Text style={s.scoreItemLabel}>Consistency</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={s.scoreItemValue}>{DEMO_SCORE.balance}</Text>
            <Text style={s.scoreItemLabel}>Balance</Text>
          </View>
        </View>
        <View style={s.streakBadge}>
          <Text style={s.streakText}>{DEMO_SCORE.streak}-day streak</Text>
        </View>
      </View>

      {/* Today's Summary */}
      <Text style={s.sectionTitle}>Today's Summary</Text>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalCalories}</Text>
            <Text style={s.summaryLabel}>Calories</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalProtein}g</Text>
            <Text style={s.summaryLabel}>Protein</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalCarbs}g</Text>
            <Text style={s.summaryLabel}>Carbs</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalFat}g</Text>
            <Text style={s.summaryLabel}>Fat</Text>
          </View>
        </View>

        {DEMO_MEALS.map((meal) => {
          const mealColor = MEAL_TYPE_COLORS[meal.mealType] || t.text.muted;
          const mealInfo = MEAL_TYPES.find((mt) => mt.key === meal.mealType);
          return (
            <View key={meal.id} style={s.mealRow}>
              <View style={[s.mealIcon, { backgroundColor: mealColor }]}>
                <Text style={s.mealIconText}>{mealInfo?.icon || '?'}</Text>
              </View>
              <View style={s.mealInfo}>
                <Text style={s.mealName}>{meal.name}</Text>
                <Text style={s.mealMeta}>
                  {meal.time} | P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                </Text>
              </View>
              <View style={s.mealCalories}>
                <Text style={s.mealCalText}>{meal.calories}</Text>
                <Text style={s.mealCalLabel}>cal</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Meal */}
      <Text style={s.sectionTitle}>Log a Meal</Text>
      <View style={s.card}>
        <Text style={[s.mealMeta, { marginBottom: 8 }]}>Meal Type</Text>
        <View style={s.typeGrid}>
          {MEAL_TYPES.map((mt) => (
            <TouchableOpacity
              key={mt.key}
              style={[s.typeChip, logMealType === mt.key && s.typeChipSelected]}
              onPress={() => setLogMealType(mt.key)}
            >
              <Text style={[s.typeChipText, logMealType === mt.key && s.typeChipTextSelected]}>
                {mt.icon} {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder="Meal name / description"
          placeholderTextColor={t.text.muted}
          value={logName}
          onChangeText={setLogName}
        />

        <TextInput
          style={s.input}
          placeholder="Approximate calories"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={logCalories}
          onChangeText={setLogCalories}
        />

        <TextInput
          style={s.input}
          placeholder="Protein (g, optional)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={logProtein}
          onChangeText={setLogProtein}
        />

        <TextInput
          style={s.input}
          placeholder="Carbs (g, optional)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={logCarbs}
          onChangeText={setLogCarbs}
        />

        <TextInput
          style={s.input}
          placeholder="Fat (g, optional)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={logFat}
          onChangeText={setLogFat}
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleLogMeal}>
          <Text style={s.submitText}>Log Meal</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Plan Tab ───

  const renderPlan = () => (
    <>
      <Text style={s.sectionTitle}>Meal Plan Suggestions</Text>
      {DEMO_PLANS.map((plan) => (
        <View key={plan.id} style={s.planCard}>
          <Text style={s.planTitle}>{plan.title}</Text>
          <Text style={s.planSource}>{plan.source} | {plan.season}</Text>
          <View style={s.planMeals}>
            {plan.meals.map((meal, idx) => (
              <Text key={idx} style={s.planMealItem}>
                {MEAL_TYPES[idx]?.icon || '*'} {meal}
              </Text>
            ))}
          </View>
          <View style={s.planFooter}>
            <View>
              <Text style={s.planCalories}>~{plan.estimatedCalories} cal/day</Text>
              <Text style={s.planProduce}>Local: {plan.localProduce.join(', ')}</Text>
            </View>
            <TouchableOpacity
              style={s.planUseBtn}
              onPress={() => Alert.alert('Plan Selected', `"${plan.title}" applied to your weekly plan.`)}
            >
              <Text style={s.planUseBtnText}>Use Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Learn Tab ───

  const renderLearn = () => (
    <>
      <Text style={s.sectionTitle}>Nutrition Education</Text>
      {DEMO_GUIDES.map((guide) => (
        <View key={guide.id} style={s.guideCard}>
          <Text style={s.guideCategory}>{guide.category}</Text>
          <Text style={s.guideTitle}>{guide.title}</Text>
          <Text style={s.guideSummary}>{guide.summary}</Text>
          <Text style={s.guideRead}>{guide.readTime} read</Text>
        </View>
      ))}
    </>
  );

  // ─── Community Tab ───

  const renderCommunity = () => (
    <>
      <Text style={s.sectionTitle}>Community Cooking Classes</Text>
      {DEMO_CLASSES.map((cls) => (
        <View key={cls.id} style={s.classCard}>
          <Text style={s.classTitle}>{cls.title}</Text>
          <Text style={s.classMeta}>
            {cls.cuisine} | {cls.date} at {cls.time}
          </Text>
          <Text style={s.classMeta}>
            Instructor: {cls.instructor === 'you' ? 'You' : cls.instructor.split('...')[1] || cls.instructor}
            {' | '}{cls.spotsLeft} spots left
          </Text>
          {cls.isTeaching && (
            <View style={s.teachingBadge}>
              <Text style={s.teachingText}>YOU ARE TEACHING</Text>
            </View>
          )}
          <View style={s.classFooter}>
            <Text style={s.classEotk}>
              {cls.isTeaching ? `Earn +${cls.eotkReward} eOTK` : `+${cls.eotkReward} eOTK for attending`}
            </Text>
            {!cls.isTeaching && (
              <TouchableOpacity
                style={s.classJoinBtn}
                onPress={() => Alert.alert('Joined', `You joined "${cls.title}". See you there!`)}
              >
                <Text style={s.classJoinText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Nutrition</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabsList.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'log' && renderLog()}
        {tab === 'plan' && renderPlan()}
        {tab === 'learn' && renderLearn()}
        {tab === 'community' && renderCommunity()}
      </ScrollView>
    </SafeAreaView>
  );
}
