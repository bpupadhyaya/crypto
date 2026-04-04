import { fonts } from '../utils/theme';
/**
 * Cooking Screen — Community cooking, recipe sharing, food culture.
 *
 * Article I: "Food is the universal language. Sharing recipes preserves
 *  culture, nourishes bodies, and brings communities to the same table."
 * — Human Constitution, Article I
 *
 * Features:
 * - Recipe collection — community-shared recipes
 * - Cook-along events (community cooking sessions, virtual or in-person)
 * - Food culture stories (the story behind traditional recipes)
 * - Ingredient exchange (share surplus with cooks who need them)
 * - Chef of the week (featured community cook)
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

type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'preserving' | 'fermenting';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  category: RecipeCategory;
  difficulty: Difficulty;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  author: string;
  likes: number;
  cooked: number;
}

interface CookAlong {
  id: string;
  title: string;
  recipe: string;
  host: string;
  date: string;
  time: string;
  location: string;
  virtual: boolean;
  capacity: number;
  attending: number;
  description: string;
}

interface CultureStory {
  id: string;
  recipeName: string;
  origin: string;
  story: string;
  author: string;
}

interface IngredientOffer {
  id: string;
  ingredient: string;
  quantity: string;
  offeredBy: string;
  location: string;
  available: boolean;
}

interface FeaturedChef {
  uid: string;
  name: string;
  specialty: string;
  recipesShared: number;
  cookAlongsHosted: number;
  bio: string;
  signatureRecipe: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const RECIPE_CATEGORIES: Array<{ key: RecipeCategory; label: string; icon: string }> = [
  { key: 'breakfast', label: 'Breakfast', icon: 'B' },
  { key: 'lunch', label: 'Lunch', icon: 'L' },
  { key: 'dinner', label: 'Dinner', icon: 'D' },
  { key: 'snack', label: 'Snack', icon: 'S' },
  { key: 'dessert', label: 'Dessert', icon: 'T' },
  { key: 'preserving', label: 'Preserving', icon: 'P' },
  { key: 'fermenting', label: 'Fermenting', icon: 'F' },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#34C759',
  medium: '#FF9500',
  hard: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_RECIPES: Recipe[] = [
  {
    id: 'r1', title: 'Grandma Rosa\'s Tamales', cuisine: 'Mexican', category: 'dinner',
    difficulty: 'hard', prepTime: '2 hours', cookTime: '1.5 hours', servings: 24,
    ingredients: ['Masa harina', 'Pork shoulder', 'Dried chiles', 'Corn husks', 'Lard', 'Cumin', 'Garlic', 'Onion', 'Salt'],
    steps: ['Soak corn husks overnight', 'Cook and shred pork', 'Prepare chile sauce', 'Mix masa with lard and broth', 'Spread masa on husks, fill, and fold', 'Steam for 1.5 hours'],
    author: 'openchain1abc...chef_rosa', likes: 142, cooked: 67,
  },
  {
    id: 'r2', title: 'Japanese Miso Soup', cuisine: 'Japanese', category: 'dinner',
    difficulty: 'easy', prepTime: '10 min', cookTime: '15 min', servings: 4,
    ingredients: ['Dashi stock', 'White miso paste', 'Silken tofu', 'Wakame seaweed', 'Green onions'],
    steps: ['Heat dashi stock', 'Dissolve miso paste in a small amount of broth', 'Add tofu cubes and wakame', 'Combine miso mixture (never boil after adding)', 'Garnish with green onions'],
    author: 'openchain1def...cook_yuki', likes: 198, cooked: 124,
  },
  {
    id: 'r3', title: 'Sourdough Bread', cuisine: 'European', category: 'breakfast',
    difficulty: 'medium', prepTime: '30 min + 12h rise', cookTime: '45 min', servings: 1,
    ingredients: ['Bread flour', 'Sourdough starter', 'Water', 'Salt'],
    steps: ['Mix flour, water, and starter', 'Autolyse 30 minutes', 'Add salt and fold', 'Bulk ferment 4-6 hours with folds every 30 min', 'Shape and cold retard overnight', 'Bake in Dutch oven at 450F'],
    author: 'openchain1ghi...baker_sam', likes: 256, cooked: 89,
  },
  {
    id: 'r4', title: 'Kimchi', cuisine: 'Korean', category: 'fermenting',
    difficulty: 'medium', prepTime: '1 hour', cookTime: '3-7 days ferment', servings: 8,
    ingredients: ['Napa cabbage', 'Korean chili flakes (gochugaru)', 'Fish sauce', 'Garlic', 'Ginger', 'Green onions', 'Salt', 'Sugar'],
    steps: ['Salt and wilt cabbage for 2 hours', 'Make paste with gochugaru, garlic, ginger, fish sauce', 'Rinse cabbage and mix with paste', 'Pack tightly into jars', 'Ferment at room temp 1-3 days, then refrigerate'],
    author: 'openchain1jkl...ferment_ji', likes: 178, cooked: 56,
  },
  {
    id: 'r5', title: 'Masala Chai', cuisine: 'Indian', category: 'snack',
    difficulty: 'easy', prepTime: '5 min', cookTime: '10 min', servings: 2,
    ingredients: ['Black tea leaves', 'Whole milk', 'Water', 'Sugar', 'Cardamom pods', 'Ginger', 'Cinnamon stick', 'Cloves'],
    steps: ['Crush cardamom and ginger', 'Boil water with spices for 3 minutes', 'Add tea leaves and simmer', 'Add milk and bring to a boil', 'Strain and add sugar to taste'],
    author: 'openchain1mno...chai_priya', likes: 312, cooked: 201,
  },
];

const DEMO_COOKALONGS: CookAlong[] = [
  {
    id: 'ca1', title: 'Tamale Making Party', recipe: 'Grandma Rosa\'s Tamales',
    host: 'openchain1abc...chef_rosa', date: '2026-04-05', time: '10:00 AM',
    location: 'Community Kitchen, Building C', virtual: false, capacity: 12, attending: 9,
    description: 'Learn to make authentic tamales from scratch. All ingredients provided. Bring containers to take some home!',
  },
  {
    id: 'ca2', title: 'Virtual Sourdough Workshop', recipe: 'Sourdough Bread',
    host: 'openchain1ghi...baker_sam', date: '2026-04-08', time: '6:00 PM',
    location: 'Video call link shared after signup', virtual: true, capacity: 30, attending: 18,
    description: 'Start your sourdough journey. We will mix the dough together and I will guide you through the 2-day process.',
  },
];

const DEMO_STORIES: CultureStory[] = [
  {
    id: 'cs1', recipeName: 'Tamales', origin: 'Mesoamerica',
    story: 'Tamales date back to 8000 BC in Mesoamerica. They were portable food for hunters, travelers, and warriors. Every family has their own recipe passed down through generations. Making tamales is always a communal activity — a tamalada — where family gathers, shares stories, and folds together.',
    author: 'openchain1abc...chef_rosa',
  },
  {
    id: 'cs2', recipeName: 'Kimchi', origin: 'Korea',
    story: 'Kimjang — the communal making of kimchi — is a UNESCO Intangible Cultural Heritage. Before refrigeration, entire neighborhoods would gather in late autumn to prepare enough kimchi to last through winter. The tradition embodies Korean values of sharing, preparation, and community resilience.',
    author: 'openchain1jkl...ferment_ji',
  },
  {
    id: 'cs3', recipeName: 'Masala Chai', origin: 'India',
    story: 'Chai is not just a drink — it is an invitation. In India, offering chai to a guest is a fundamental act of hospitality. Every household has its own spice blend, passed down and adjusted over generations. Street chai-wallahs are the heartbeat of every neighborhood, where strangers become friends over a shared cup.',
    author: 'openchain1mno...chai_priya',
  },
];

const DEMO_INGREDIENTS: IngredientOffer[] = [
  { id: 'i1', ingredient: 'Fresh Rosemary (large bunch)', quantity: '3 bunches', offeredBy: 'openchain1ghi...baker_sam', location: 'Building A, Apt 4', available: true },
  { id: 'i2', ingredient: 'Sourdough Starter', quantity: 'Unlimited (just ask!)', offeredBy: 'openchain1ghi...baker_sam', location: 'Building A, Apt 4', available: true },
  { id: 'i3', ingredient: 'Korean Chili Flakes (Gochugaru)', quantity: '500g bag', offeredBy: 'openchain1jkl...ferment_ji', location: 'Riverside Complex, Unit 12', available: true },
  { id: 'i4', ingredient: 'Meyer Lemons (backyard tree)', quantity: '~20 lemons', offeredBy: 'openchain1pqr...garden_aisha', location: 'Elm Street, House 7', available: true },
];

const DEMO_FEATURED_CHEF: FeaturedChef = {
  uid: 'openchain1abc...chef_rosa',
  name: 'Rosa M.',
  specialty: 'Traditional Mexican Cuisine',
  recipesShared: 28,
  cookAlongsHosted: 12,
  bio: 'Third-generation cook from Oaxaca. My grandmother taught me that food is memory made edible. Every dish carries a story, and every meal shared strengthens the community.',
  signatureRecipe: 'Grandma Rosa\'s Tamales',
};

type Tab = 'recipes' | 'events' | 'culture' | 'exchange';

export function CookingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('recipes');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<RecipeCategory | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredRecipes = useMemo(() => {
    if (!filterCategory) return DEMO_RECIPES;
    return DEMO_RECIPES.filter((r) => r.category === filterCategory);
  }, [filterCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.orange + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.orange },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.orange + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap', gap: 6 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.orange + '20', borderColor: t.accent.orange },
    filterText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.orange },
    recipeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    recipeTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    recipeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    recipeStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
    recipeStat: { color: t.text.muted, fontSize: fonts.sm },
    recipeSection: { marginTop: 12 },
    recipeSectionLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    ingredientText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 22 },
    stepText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 22, marginBottom: 4 },
    expandBtn: { marginTop: 10, paddingVertical: 6 },
    expandBtnText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    eventDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 20 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    attendingText: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold },
    virtualBadge: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    virtualText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.orange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    storyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    storyRecipe: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold },
    storyOrigin: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    storyText: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 22 },
    storyAuthor: { color: t.text.muted, fontSize: fonts.xs, marginTop: 8, fontStyle: 'italic' },
    ingredientCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    ingredientName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    ingredientQty: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 2 },
    ingredientLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    claimBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    claimBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    chefCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    chefName: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, marginTop: 8 },
    chefSpecialty: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 2 },
    chefBio: { color: t.text.secondary, fontSize: fonts.sm, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    chefStats: { flexDirection: 'row', gap: 24, marginTop: 12 },
    chefStatItem: { alignItems: 'center' },
    chefStatValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    chefStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    chefSignature: { color: t.text.muted, fontSize: fonts.sm, marginTop: 10, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabDefs: Array<{ key: Tab; label: string }> = [
    { key: 'recipes', label: 'Recipes' },
    { key: 'events', label: 'Cook-Alongs' },
    { key: 'culture', label: 'Culture' },
    { key: 'exchange', label: 'Exchange' },
  ];

  // ─── Recipes Tab ───

  const renderRecipes = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>C</Text>
        <Text style={s.heroTitle}>Community Cookbook</Text>
        <Text style={s.heroSubtitle}>
          Recipes shared by your neighbors.{'\n'}
          Every dish tells a story. Every meal builds community.
        </Text>
      </View>

      {/* Chef of the Week */}
      <Text style={s.sectionTitle}>Chef of the Week</Text>
      <View style={s.chefCard}>
        <Text style={{ fontSize: fonts.hero }}>C</Text>
        <Text style={s.chefName}>{DEMO_FEATURED_CHEF.name}</Text>
        <Text style={s.chefSpecialty}>{DEMO_FEATURED_CHEF.specialty}</Text>
        <Text style={s.chefBio}>{DEMO_FEATURED_CHEF.bio}</Text>
        <View style={s.chefStats}>
          <View style={s.chefStatItem}>
            <Text style={s.chefStatValue}>{DEMO_FEATURED_CHEF.recipesShared}</Text>
            <Text style={s.chefStatLabel}>Recipes</Text>
          </View>
          <View style={s.chefStatItem}>
            <Text style={s.chefStatValue}>{DEMO_FEATURED_CHEF.cookAlongsHosted}</Text>
            <Text style={s.chefStatLabel}>Cook-Alongs</Text>
          </View>
        </View>
        <Text style={s.chefSignature}>Signature: {DEMO_FEATURED_CHEF.signatureRecipe}</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterCategory && s.filterChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[s.filterText, !filterCategory && s.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {RECIPE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.filterChip, filterCategory === cat.key && s.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === cat.key ? null : cat.key)}
            >
              <Text style={[s.filterText, filterCategory === cat.key && s.filterTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Recipe List */}
      <Text style={s.sectionTitle}>Recipes ({filteredRecipes.length})</Text>
      {filteredRecipes.map((recipe) => {
        const expanded = expandedRecipe === recipe.id;
        const catInfo = RECIPE_CATEGORIES.find((c) => c.key === recipe.category);
        return (
          <View key={recipe.id} style={s.recipeCard}>
            <Text style={s.recipeTitle}>{recipe.title}</Text>
            <Text style={s.recipeMeta}>
              {recipe.cuisine} | {catInfo?.label || recipe.category} | {recipe.servings} servings
            </Text>
            <Text style={s.recipeMeta}>
              Prep: {recipe.prepTime} | Cook: {recipe.cookTime}
            </Text>
            <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[recipe.difficulty] }]}>
              <Text style={s.diffText}>{recipe.difficulty}</Text>
            </View>
            <View style={s.recipeStats}>
              <Text style={s.recipeStat}>{recipe.likes} likes</Text>
              <Text style={s.recipeStat}>{recipe.cooked} cooked this</Text>
            </View>

            {expanded && (
              <>
                <View style={s.recipeSection}>
                  <Text style={s.recipeSectionLabel}>Ingredients</Text>
                  {recipe.ingredients.map((ing, i) => (
                    <Text key={i} style={s.ingredientText}>  - {ing}</Text>
                  ))}
                </View>
                <View style={s.recipeSection}>
                  <Text style={s.recipeSectionLabel}>Steps</Text>
                  {recipe.steps.map((step, i) => (
                    <Text key={i} style={s.stepText}>{i + 1}. {step}</Text>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={s.expandBtn}
              onPress={() => setExpandedRecipe(expanded ? null : recipe.id)}
            >
              <Text style={s.expandBtnText}>{expanded ? 'Show Less' : 'View Full Recipe'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  // ─── Events Tab (Cook-Alongs) ───

  const renderEvents = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>E</Text>
        <Text style={s.heroTitle}>Cook-Along Events</Text>
        <Text style={s.heroSubtitle}>
          Cook together. Learn together.{'\n'}
          Virtual and in-person community cooking sessions.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Cook-Alongs</Text>
      {DEMO_COOKALONGS.map((event) => (
        <View key={event.id} style={s.eventCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.eventTitle}>{event.title}</Text>
            {event.virtual && (
              <View style={s.virtualBadge}>
                <Text style={s.virtualText}>VIRTUAL</Text>
              </View>
            )}
          </View>
          <Text style={s.eventMeta}>
            {event.date} at {event.time} | {event.location}
          </Text>
          <Text style={s.eventMeta}>Recipe: {event.recipe}</Text>
          <Text style={s.eventDesc}>{event.description}</Text>
          <View style={s.eventFooter}>
            <Text style={s.attendingText}>{event.attending}/{event.capacity} attending</Text>
            <TouchableOpacity
              style={s.joinBtn}
              onPress={() => Alert.alert('Joined!', `You are signed up for "${event.title}".`)}
            >
              <Text style={s.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Culture Tab ───

  const renderCulture = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>H</Text>
        <Text style={s.heroTitle}>Food Culture Stories</Text>
        <Text style={s.heroSubtitle}>
          The history and heart behind the recipes we share.{'\n'}
          Every dish carries the memory of its people.
        </Text>
      </View>

      {DEMO_STORIES.map((story) => (
        <View key={story.id} style={s.storyCard}>
          <Text style={s.storyRecipe}>{story.recipeName}</Text>
          <Text style={s.storyOrigin}>Origin: {story.origin}</Text>
          <Text style={s.storyText}>{story.story}</Text>
          <Text style={s.storyAuthor}>Shared by {story.author.slice(0, 20)}...</Text>
        </View>
      ))}
    </>
  );

  // ─── Exchange Tab ───

  const renderExchange = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>X</Text>
        <Text style={s.heroTitle}>Ingredient Exchange</Text>
        <Text style={s.heroSubtitle}>
          Have surplus herbs, eggs, or spices?{'\n'}
          Share with cooks who need them. Reduce waste. Build bonds.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Available Ingredients</Text>
      {DEMO_INGREDIENTS.map((item) => (
        <View key={item.id} style={s.ingredientCard}>
          <Text style={s.ingredientName}>{item.ingredient}</Text>
          <Text style={s.ingredientQty}>{item.quantity}</Text>
          <Text style={s.ingredientLocation}>
            From: {item.offeredBy.slice(0, 20)}... | {item.location}
          </Text>
          <TouchableOpacity
            style={s.claimBtn}
            onPress={() => Alert.alert('Claimed!', `You have claimed "${item.ingredient}". Coordinate pickup with the donor.`)}
          >
            <Text style={s.claimBtnText}>Claim</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Main Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Cooking</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabDefs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'recipes' && renderRecipes()}
        {tab === 'events' && renderEvents()}
        {tab === 'culture' && renderCulture()}
        {tab === 'exchange' && renderExchange()}
      </ScrollView>
    </SafeAreaView>
  );
}
