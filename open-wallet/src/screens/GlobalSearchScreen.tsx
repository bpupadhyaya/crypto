/**
 * Global Search Screen — Find anything across all 246 screens.
 *
 * Universal search with category filters, recent searches, and
 * suggested quick-access. Every screen in the system is findable here.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import { searchScreens, getSearchableScreens } from '../core/navigation/deepLinks';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface SearchResult {
  key: string;
  label: string;
  category: string;
  view: string;
  emoji: string;
  description: string;
  keywords: string[];
}

// ─── Category Config ───

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '\u{1F50D}' },
  { key: 'health', label: 'Health', emoji: '\u{1FA7A}' },
  { key: 'education', label: 'Education', emoji: '\u{1F4DA}' },
  { key: 'economy', label: 'Economy', emoji: '\u{1F4B0}' },
  { key: 'governance', label: 'Governance', emoji: '\u{1F3DB}' },
  { key: 'community', label: 'Community', emoji: '\u{1F91D}' },
  { key: 'culture', label: 'Culture', emoji: '\u{1F3A8}' },
  { key: 'nature', label: 'Nature', emoji: '\u{1F33F}' },
  { key: 'safety', label: 'Safety', emoji: '\u{1F6E1}' },
  { key: 'family', label: 'Family', emoji: '\u{1F46A}' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  wallet: '#3B82F6',
  identity: '#8B5CF6',
  privacy: '#6366F1',
  chain: '#F59E0B',
  governance: '#EF4444',
  health: '#10B981',
  education: '#6366F1',
  economy: '#F97316',
  community: '#EC4899',
  culture: '#A855F7',
  nature: '#22C55E',
  safety: '#EF4444',
  needs: '#F59E0B',
  inclusion: '#14B8A6',
  family: '#F472B6',
  support: '#8B5CF6',
  impact: '#3B82F6',
  personal: '#A78BFA',
};

const POPULAR_SEARCHES = [
  'Gratitude', 'Family Tree', 'Governance', 'Yoga', 'Volunteer',
  'Peace Index', 'Tree Planting', 'Marketplace', 'Meditation', 'Education Hub',
];

const RECENT_SEARCHES_KEY = '@global_search_recent';

// ─── Extended Screen Registry with Metadata ───
// Inline descriptions, emojis, and keywords for all screens.

const SCREEN_META: Record<string, { emoji: string; description: string; keywords: string[] }> = {
  // Core Wallet
  'home':               { emoji: '\u{1F3E0}', description: 'Main wallet dashboard', keywords: ['wallet', 'balance', 'portfolio', 'dashboard'] },
  'send':               { emoji: '\u{1F4E4}', description: 'Send crypto or OTK tokens', keywords: ['transfer', 'pay', 'send', 'transaction'] },
  'receive':            { emoji: '\u{1F4E5}', description: 'Receive tokens and view address', keywords: ['deposit', 'address', 'qr', 'receive'] },
  'swap':               { emoji: '\u{1F504}', description: 'Swap between tokens', keywords: ['exchange', 'trade', 'convert', 'swap'] },

  // Identity & Privacy
  'universal-id':       { emoji: '\u{1F194}', description: 'Your Universal ID and credentials', keywords: ['id', 'identity', 'credential', 'verification'] },
  'identity':           { emoji: '\u{1F464}', description: 'Identity and reputation management', keywords: ['reputation', 'profile', 'trust'] },
  'guardian':           { emoji: '\u{1F6E1}', description: 'Guardian accounts for social recovery', keywords: ['guardian', 'recovery', 'backup', 'social'] },
  'cross-chain-id':     { emoji: '\u{1F517}', description: 'Cross-chain identity linking', keywords: ['cross-chain', 'multi-chain', 'bridge', 'link'] },
  'reputation':         { emoji: '\u{2B50}', description: 'Reputation dashboard and scores', keywords: ['reputation', 'trust', 'score', 'rating'] },
  'zk-proof':           { emoji: '\u{1F575}', description: 'Zero-knowledge proof management', keywords: ['privacy', 'zero-knowledge', 'zk', 'proof', 'anonymous'] },
  'data-sovereignty':   { emoji: '\u{1F512}', description: 'Control your personal data', keywords: ['data', 'privacy', 'sovereignty', 'gdpr', 'consent'] },
  'pqc-key':            { emoji: '\u{1F511}', description: 'Post-quantum cryptography keys', keywords: ['quantum', 'encryption', 'key', 'pqc', 'security'] },

  // Value Channels
  'value-channels':     { emoji: '\u{1F4CA}', description: 'Overview of all OTK value channels', keywords: ['notk', 'eotk', 'cotk', 'channels', 'value'] },
  'living-ledger':      { emoji: '\u{1F4D6}', description: 'Living ledger of all contributions', keywords: ['ledger', 'contributions', 'history', 'record'] },
  'gratitude':          { emoji: '\u{1F49B}', description: 'Send gratitude to those who shaped you', keywords: ['gratitude', 'thank', 'appreciation', 'nurture'] },
  'gratitude-wall':     { emoji: '\u{1F3DB}', description: 'Public wall of gratitude transactions', keywords: ['gratitude', 'wall', 'public', 'recognition'] },
  'gratitude-journal':  { emoji: '\u{1F4D3}', description: 'Personal gratitude journal', keywords: ['journal', 'diary', 'gratitude', 'reflection'] },
  'contribution-scores':{ emoji: '\u{1F3C6}', description: 'View your contribution scores', keywords: ['score', 'contribution', 'ranking', 'points'] },
  'achievements':       { emoji: '\u{1F396}', description: 'Unlocked achievements and badges', keywords: ['achievement', 'badge', 'milestone', 'reward'] },

  // Governance
  'governance':         { emoji: '\u{1F3DB}', description: 'Governance proposals and voting', keywords: ['vote', 'proposal', 'governance', 'democracy'] },
  'dao':                { emoji: '\u{1F465}', description: 'Decentralized autonomous organizations', keywords: ['dao', 'organization', 'collective', 'governance'] },
  'election':           { emoji: '\u{1F5F3}', description: 'Community elections', keywords: ['election', 'vote', 'candidate', 'ballot'] },
  'budget':             { emoji: '\u{1F4B5}', description: 'Community budget allocation', keywords: ['budget', 'finance', 'spending', 'allocation'] },
  'petition':           { emoji: '\u{1F4DC}', description: 'Start or sign petitions', keywords: ['petition', 'sign', 'campaign', 'advocacy'] },
  'debate':             { emoji: '\u{1F4AC}', description: 'Community debates and forums', keywords: ['debate', 'discussion', 'forum', 'opinion'] },
  'civic-education':    { emoji: '\u{1F3EB}', description: 'Learn about civic participation', keywords: ['civic', 'citizenship', 'rights', 'constitution'] },
  'voting-power':       { emoji: '\u{26A1}', description: 'View and delegate voting power', keywords: ['voting', 'power', 'delegate', 'weight'] },
  'youth-council':      { emoji: '\u{1F9D1}', description: 'Youth governance council', keywords: ['youth', 'council', 'young', 'student', 'teen'] },
  'micro-grants':       { emoji: '\u{1F4B8}', description: 'Apply for community micro-grants', keywords: ['grant', 'funding', 'micro', 'seed', 'startup'] },

  // Health & Wellness
  'wellness':           { emoji: '\u{1F33F}', description: 'Wellness dashboard and tracking', keywords: ['wellness', 'health', 'wellbeing', 'tracker'] },
  'health-emergency':   { emoji: '\u{1F6A8}', description: 'Health emergency resources and SOS', keywords: ['emergency', 'sos', 'urgent', 'crisis', 'ambulance'] },
  'mental-wellness':    { emoji: '\u{1F9E0}', description: 'Mental health and counseling', keywords: ['mental', 'therapy', 'counseling', 'anxiety', 'depression'] },
  'maternal-health':    { emoji: '\u{1F930}', description: 'Maternal and prenatal health', keywords: ['maternal', 'pregnancy', 'prenatal', 'baby', 'birth'] },
  'meditation':         { emoji: '\u{1F9D8}', description: 'Guided meditation sessions', keywords: ['meditation', 'mindfulness', 'calm', 'breathe', 'zen'] },
  'yoga':               { emoji: '\u{1F9D8}', description: 'Yoga classes and practice', keywords: ['yoga', 'stretch', 'flexibility', 'pose', 'asana'] },
  'nutrition':          { emoji: '\u{1F957}', description: 'Nutrition tracking and plans', keywords: ['nutrition', 'diet', 'food', 'calories', 'meal'] },
  'sleep':              { emoji: '\u{1F634}', description: 'Sleep tracking and improvement', keywords: ['sleep', 'rest', 'insomnia', 'bedtime'] },
  'sports':             { emoji: '\u{26BD}', description: 'Sports and fitness activities', keywords: ['sports', 'fitness', 'exercise', 'gym', 'workout'] },
  'allergy':            { emoji: '\u{1F927}', description: 'Allergy management and alerts', keywords: ['allergy', 'allergen', 'intolerance', 'reaction'] },
  'recovery':           { emoji: '\u{1F49A}', description: 'Recovery support programs', keywords: ['recovery', 'addiction', 'sobriety', 'support', 'rehab'] },
  'first-aid':          { emoji: '\u{1FA79}', description: 'First aid guides and resources', keywords: ['first-aid', 'bandage', 'wound', 'cpr', 'injury'] },

  // Education
  'education-hub':      { emoji: '\u{1F393}', description: 'Central education hub', keywords: ['education', 'learning', 'study', 'school', 'class'] },
  'curriculum':         { emoji: '\u{1F4CB}', description: 'Community-built curriculum', keywords: ['curriculum', 'syllabus', 'course', 'lesson'] },
  'homeschool':         { emoji: '\u{1F3E0}', description: 'Homeschool resources and network', keywords: ['homeschool', 'home', 'school', 'parent', 'teach'] },
  'library':            { emoji: '\u{1F4DA}', description: 'Community library and resources', keywords: ['library', 'book', 'read', 'borrow', 'knowledge'] },
  'tutor':              { emoji: '\u{1F9D1}\u{200D}\u{1F3EB}', description: 'Find or become a peer tutor', keywords: ['tutor', 'teach', 'help', 'peer', 'learn'] },
  'stem':               { emoji: '\u{1F52C}', description: 'STEM education and projects', keywords: ['stem', 'science', 'technology', 'math', 'engineering'] },
  'skill-verification': { emoji: '\u{2705}', description: 'Verify and certify skills', keywords: ['skill', 'verify', 'certify', 'credential', 'badge'] },
  'digital-literacy':   { emoji: '\u{1F4BB}', description: 'Digital literacy training', keywords: ['digital', 'computer', 'internet', 'literacy', 'tech'] },
  'book-club':          { emoji: '\u{1F4D6}', description: 'Join or start book clubs', keywords: ['book', 'club', 'reading', 'discussion', 'literature'] },
  'apprenticeship':     { emoji: '\u{1F6E0}', description: 'Apprenticeship opportunities', keywords: ['apprentice', 'trade', 'craft', 'hands-on', 'learn'] },
  'language-exchange':  { emoji: '\u{1F30D}', description: 'Language exchange partners', keywords: ['language', 'translate', 'foreign', 'bilingual', 'speak'] },
  'financial-literacy': { emoji: '\u{1F4B1}', description: 'Learn about money and finance', keywords: ['finance', 'money', 'investing', 'saving', 'budget'] },
  'public-speaking':    { emoji: '\u{1F399}', description: 'Public speaking practice', keywords: ['speaking', 'presentation', 'speech', 'debate', 'communication'] },

  // Economy
  'job-board':          { emoji: '\u{1F4BC}', description: 'Community job listings', keywords: ['job', 'work', 'career', 'hire', 'employment'] },
  'marketplace':        { emoji: '\u{1F6D2}', description: 'Buy and sell in the community', keywords: ['buy', 'sell', 'market', 'shop', 'trade'] },
  'cooperative':        { emoji: '\u{1F91D}', description: 'Worker and consumer cooperatives', keywords: ['coop', 'cooperative', 'collective', 'shared'] },
  'time-bank':          { emoji: '\u{23F0}', description: 'Exchange time for services', keywords: ['time', 'bank', 'hour', 'service', 'exchange'] },
  'barter':             { emoji: '\u{1F501}', description: 'Barter goods and services', keywords: ['barter', 'trade', 'exchange', 'swap'] },
  'farm-to-table':      { emoji: '\u{1F33E}', description: 'Connect with local farms', keywords: ['farm', 'food', 'local', 'organic', 'fresh', 'agriculture'] },
  'workshop':           { emoji: '\u{1F3ED}', description: 'Community workshop and makerspace', keywords: ['workshop', 'maker', 'build', 'tools', 'craft'] },
  'innovation':         { emoji: '\u{1F4A1}', description: 'Innovation hub and incubator', keywords: ['innovation', 'startup', 'idea', 'incubator', 'create'] },
  'insurance-pool':     { emoji: '\u{1F3E6}', description: 'Community insurance pools', keywords: ['insurance', 'pool', 'coverage', 'mutual', 'protect'] },
  'supply-chain':       { emoji: '\u{1F69A}', description: 'Track community supply chains', keywords: ['supply', 'chain', 'logistics', 'track', 'source'] },
  'coworking':          { emoji: '\u{1F4BB}', description: 'Find co-working spaces', keywords: ['cowork', 'office', 'space', 'desk', 'remote'] },
  'repair-cafe':        { emoji: '\u{1F527}', description: 'Repair items instead of replacing', keywords: ['repair', 'fix', 'reuse', 'sustainable', 'mend'] },
  'skill-swap':         { emoji: '\u{1F500}', description: 'Swap skills with others', keywords: ['skill', 'swap', 'exchange', 'teach', 'learn'] },
  'networking':         { emoji: '\u{1F310}', description: 'Professional networking events', keywords: ['network', 'connect', 'professional', 'meetup'] },

  // Community
  'community-board':    { emoji: '\u{1F4CC}', description: 'Community bulletin board', keywords: ['board', 'bulletin', 'announcement', 'post'] },
  'community-radio':    { emoji: '\u{1F4FB}', description: 'Community radio broadcasts', keywords: ['radio', 'broadcast', 'listen', 'show', 'audio'] },
  'community-projects': { emoji: '\u{1F3D7}', description: 'Community building projects', keywords: ['project', 'build', 'initiative', 'collaboration'] },
  'community-map':      { emoji: '\u{1F5FA}', description: 'Interactive community map', keywords: ['map', 'location', 'nearby', 'find', 'local'] },
  'volunteer':          { emoji: '\u{1F64B}', description: 'Volunteer opportunities', keywords: ['volunteer', 'help', 'serve', 'donate', 'time'] },
  'volunteer-match':    { emoji: '\u{1F91D}', description: 'Match with volunteer needs', keywords: ['volunteer', 'match', 'need', 'opportunity'] },
  'volunteer-abroad':   { emoji: '\u{2708}', description: 'International volunteer programs', keywords: ['abroad', 'international', 'travel', 'global', 'volunteer'] },
  'neighbor-help':      { emoji: '\u{1F3E1}', description: 'Help your neighbors', keywords: ['neighbor', 'help', 'local', 'assist', 'community'] },
  'childcare':          { emoji: '\u{1F476}', description: 'Childcare coordination', keywords: ['childcare', 'babysit', 'daycare', 'kids', 'children'] },
  'news':               { emoji: '\u{1F4F0}', description: 'Community news feed', keywords: ['news', 'update', 'article', 'headline'] },
  'feedback':           { emoji: '\u{1F4AC}', description: 'Give and receive feedback', keywords: ['feedback', 'review', 'suggest', 'opinion', 'improve'] },
  'calendar':           { emoji: '\u{1F4C5}', description: 'Community events calendar', keywords: ['calendar', 'event', 'schedule', 'date', 'upcoming'] },
  'neighborhood':       { emoji: '\u{1F3D8}', description: 'Neighborhood information', keywords: ['neighborhood', 'area', 'local', 'district', 'zone'] },
  'cleanup-drive':      { emoji: '\u{1F9F9}', description: 'Join or organize cleanup drives', keywords: ['cleanup', 'clean', 'trash', 'litter', 'environment'] },
  'storytelling':       { emoji: '\u{1F4D6}', description: 'Share and hear stories', keywords: ['story', 'tell', 'narrative', 'share', 'oral'] },
  'podcast':            { emoji: '\u{1F3A7}', description: 'Community podcasts', keywords: ['podcast', 'listen', 'episode', 'audio', 'show'] },
  'pen-pal':            { emoji: '\u{2709}', description: 'Connect with pen pals', keywords: ['pen-pal', 'letter', 'write', 'friend', 'correspond'] },
  'pet-welfare':        { emoji: '\u{1F43E}', description: 'Pet welfare and adoption', keywords: ['pet', 'animal', 'adopt', 'rescue', 'welfare'] },
  'incident-report':    { emoji: '\u{1F4CB}', description: 'Report community incidents', keywords: ['incident', 'report', 'safety', 'alert', 'issue'] },

  // Culture & Arts
  'cultural-heritage':  { emoji: '\u{1F3DB}', description: 'Preserve cultural heritage', keywords: ['culture', 'heritage', 'tradition', 'history', 'preserve'] },
  'art-studio':         { emoji: '\u{1F3A8}', description: 'Digital art studio', keywords: ['art', 'paint', 'draw', 'create', 'studio'] },
  'music':              { emoji: '\u{1F3B5}', description: 'Music creation and sharing', keywords: ['music', 'song', 'instrument', 'band', 'sing'] },
  'dance':              { emoji: '\u{1F483}', description: 'Dance classes and events', keywords: ['dance', 'movement', 'choreography', 'ballet'] },
  'poetry':             { emoji: '\u{1F4DD}', description: 'Poetry writing and reading', keywords: ['poetry', 'poem', 'verse', 'rhyme', 'write'] },
  'photo':              { emoji: '\u{1F4F7}', description: 'Photography community', keywords: ['photo', 'camera', 'picture', 'image', 'lens'] },
  'film':               { emoji: '\u{1F3AC}', description: 'Film making and cinema', keywords: ['film', 'movie', 'cinema', 'video', 'direct'] },
  'cooking':            { emoji: '\u{1F373}', description: 'Cooking recipes and classes', keywords: ['cook', 'recipe', 'kitchen', 'food', 'bake', 'chef'] },
  'textile':            { emoji: '\u{1F9F5}', description: 'Textile arts and crafts', keywords: ['textile', 'weave', 'knit', 'sew', 'fabric', 'craft'] },
  'games':              { emoji: '\u{1F3AE}', description: 'Community games and play', keywords: ['game', 'play', 'fun', 'board', 'puzzle'] },
  'ceremony':           { emoji: '\u{1F56F}', description: 'Community ceremonies', keywords: ['ceremony', 'ritual', 'celebration', 'tradition'] },
  'elder-wisdom':       { emoji: '\u{1F9D3}', description: 'Wisdom from elders', keywords: ['elder', 'wisdom', 'senior', 'advice', 'experience'] },
  'travel':             { emoji: '\u{2708}', description: 'Community travel and trips', keywords: ['travel', 'trip', 'journey', 'tour', 'explore'] },

  // Nature & Environment
  'environmental':      { emoji: '\u{1F30E}', description: 'Environmental impact tracking', keywords: ['environment', 'impact', 'carbon', 'footprint', 'eco'] },
  'climate-action':     { emoji: '\u{1F321}', description: 'Climate action initiatives', keywords: ['climate', 'warming', 'carbon', 'emission', 'action'] },
  'renewable-energy':   { emoji: '\u{2600}', description: 'Renewable energy projects', keywords: ['renewable', 'solar', 'wind', 'energy', 'green'] },
  'tree-planting':      { emoji: '\u{1F333}', description: 'Tree planting campaigns', keywords: ['tree', 'plant', 'forest', 'reforest', 'green'] },
  'wildlife':           { emoji: '\u{1F98B}', description: 'Wildlife conservation', keywords: ['wildlife', 'animal', 'conservation', 'species', 'protect'] },
  'habitat':            { emoji: '\u{1F3DE}', description: 'Habitat restoration projects', keywords: ['habitat', 'restore', 'ecosystem', 'wetland', 'nature'] },
  'waste-management':   { emoji: '\u{267B}', description: 'Waste reduction and recycling', keywords: ['waste', 'recycle', 'reduce', 'compost', 'zero-waste'] },
  'weather':            { emoji: '\u{26C5}', description: 'Local weather and forecasts', keywords: ['weather', 'forecast', 'rain', 'temperature', 'storm'] },
  'permaculture':       { emoji: '\u{1F331}', description: 'Permaculture design and practice', keywords: ['permaculture', 'sustainable', 'design', 'garden', 'eco'] },
  'beekeeping':         { emoji: '\u{1F41D}', description: 'Beekeeping and pollinator support', keywords: ['bee', 'honey', 'pollinator', 'hive', 'apiary'] },
  'gardening':          { emoji: '\u{1F33B}', description: 'Community gardening', keywords: ['garden', 'grow', 'plant', 'seed', 'harvest'] },
  'aquaponics':         { emoji: '\u{1F41F}', description: 'Aquaponics and hydroponics', keywords: ['aquaponics', 'hydroponics', 'fish', 'water', 'grow'] },
  'soil':               { emoji: '\u{1F33E}', description: 'Soil health monitoring', keywords: ['soil', 'earth', 'compost', 'fertility', 'ground'] },
  'seasonal':           { emoji: '\u{1F341}', description: 'Seasonal living practices', keywords: ['seasonal', 'harvest', 'equinox', 'solstice', 'nature'] },

  // Safety
  'safety-net':         { emoji: '\u{1F6E1}', description: 'Community safety net programs', keywords: ['safety', 'net', 'support', 'help', 'social'] },
  'disaster-response':  { emoji: '\u{1F692}', description: 'Disaster response coordination', keywords: ['disaster', 'response', 'relief', 'flood', 'earthquake'] },
  'emergency-prep':     { emoji: '\u{1F4CB}', description: 'Emergency preparedness plans', keywords: ['emergency', 'prep', 'prepare', 'plan', 'kit'] },
  'emergency-contacts': { emoji: '\u{1F4DE}', description: 'Emergency contact management', keywords: ['emergency', 'contact', 'phone', 'call', 'sos'] },
  'child-safety':       { emoji: '\u{1F6B8}', description: 'Child safety resources', keywords: ['child', 'safety', 'protect', 'kid', 'abuse'] },
  'conflict-prevention':{ emoji: '\u{1F54A}', description: 'Conflict prevention and peace', keywords: ['conflict', 'peace', 'prevent', 'mediate', 'resolve'] },
  'infrastructure':     { emoji: '\u{1F3D7}', description: 'Community infrastructure', keywords: ['infrastructure', 'road', 'water', 'power', 'build'] },

  // Basic Needs
  'food-security':      { emoji: '\u{1F35E}', description: 'Food security and access', keywords: ['food', 'hunger', 'pantry', 'meal', 'nutrition'] },
  'water-sanitation':   { emoji: '\u{1F4A7}', description: 'Water and sanitation access', keywords: ['water', 'clean', 'sanitation', 'drink', 'hygiene'] },
  'housing':            { emoji: '\u{1F3E0}', description: 'Housing assistance and resources', keywords: ['housing', 'shelter', 'home', 'rent', 'affordable'] },
  'transport':          { emoji: '\u{1F68C}', description: 'Community transport coordination', keywords: ['transport', 'bus', 'ride', 'carpool', 'mobility'] },
  'basic-needs':        { emoji: '\u{2764}', description: 'Basic needs dashboard', keywords: ['needs', 'basic', 'essential', 'assistance', 'resource'] },
  'needs-assessment':   { emoji: '\u{1F4CA}', description: 'Community needs assessment', keywords: ['assess', 'needs', 'survey', 'gap', 'priority'] },
  'resource-match':     { emoji: '\u{1F91D}', description: 'Match resources to needs', keywords: ['resource', 'match', 'connect', 'provide', 'need'] },

  // Inclusion
  'disability-support': { emoji: '\u{267F}', description: 'Disability support services', keywords: ['disability', 'accessibility', 'support', 'inclusion', 'assist'] },
  'immigration-support':{ emoji: '\u{1F30D}', description: 'Newcomer and immigration support', keywords: ['immigration', 'newcomer', 'refugee', 'welcome', 'settle'] },
  'legal-aid':          { emoji: '\u{2696}', description: 'Free legal aid and advice', keywords: ['legal', 'law', 'attorney', 'rights', 'justice'] },
  'barrier-free':       { emoji: '\u{1F6AA}', description: 'Barrier-free access information', keywords: ['barrier', 'access', 'ramp', 'wheelchair', 'inclusive'] },
  'veteran':            { emoji: '\u{1F396}', description: 'Veteran support programs', keywords: ['veteran', 'military', 'service', 'va', 'support'] },

  // Family & Life
  'family-tree':        { emoji: '\u{1F333}', description: 'Build your family tree', keywords: ['family', 'tree', 'genealogy', 'ancestor', 'lineage'] },
  'family-finance':     { emoji: '\u{1F4B0}', description: 'Family financial planning', keywords: ['family', 'finance', 'budget', 'savings', 'plan'] },
  'parenting-stages':   { emoji: '\u{1F476}', description: 'Parenting by developmental stage', keywords: ['parent', 'stage', 'infant', 'toddler', 'child'] },
  'parenting-journey':  { emoji: '\u{1F9D1}\u{200D}\u{1F37C}', description: 'Your parenting journey tracker', keywords: ['parent', 'journey', 'milestone', 'growth', 'child'] },
  'eldercare':          { emoji: '\u{1F9D3}', description: 'Eldercare coordination', keywords: ['elder', 'care', 'senior', 'aging', 'caregiver'] },
  'senior-activities':  { emoji: '\u{1F3B2}', description: 'Activities for seniors', keywords: ['senior', 'activity', 'social', 'recreation', 'aging'] },
  'intergeneration':    { emoji: '\u{1F46B}', description: 'Intergenerational programs', keywords: ['intergeneration', 'bridge', 'young', 'old', 'connect'] },
  'ancestry':           { emoji: '\u{1F4DC}', description: 'Explore your ancestry', keywords: ['ancestry', 'dna', 'heritage', 'roots', 'origin'] },
  'relationship':       { emoji: '\u{1F491}', description: 'Relationship building tools', keywords: ['relationship', 'partner', 'couple', 'marriage', 'bond'] },
  'teen':               { emoji: '\u{1F9D1}', description: 'Teen space and resources', keywords: ['teen', 'adolescent', 'youth', 'young', 'puberty'] },
  'end-of-life':        { emoji: '\u{1F54A}', description: 'End of life planning', keywords: ['end-of-life', 'will', 'estate', 'advance', 'directive'] },
  'memorial':           { emoji: '\u{1F56F}', description: 'Memorial and remembrance', keywords: ['memorial', 'remember', 'tribute', 'honor', 'legacy'] },
  'personal-timeline':  { emoji: '\u{1F4C5}', description: 'Your life timeline', keywords: ['timeline', 'life', 'milestone', 'event', 'history'] },

  // Support
  'grief-support':      { emoji: '\u{1F49C}', description: 'Grief and bereavement support', keywords: ['grief', 'loss', 'bereavement', 'mourn', 'support'] },
  'mediation':          { emoji: '\u{2696}', description: 'Conflict mediation services', keywords: ['mediation', 'resolve', 'conflict', 'negotiate', 'peace'] },
  'arbitration':        { emoji: '\u{1F4DC}', description: 'Community arbitration', keywords: ['arbitration', 'dispute', 'judge', 'ruling', 'fair'] },
  'appeal':             { emoji: '\u{1F4E2}', description: 'Appeal a decision', keywords: ['appeal', 'challenge', 'review', 'decision', 'reconsider'] },
  'correction':         { emoji: '\u{1F504}', description: 'Corrections and amendments', keywords: ['correction', 'amend', 'fix', 'update', 'revise'] },

  // Impact
  'global-impact':      { emoji: '\u{1F30D}', description: 'Global impact dashboard', keywords: ['global', 'impact', 'world', 'change', 'measure'] },
  'my-impact':          { emoji: '\u{1F4CA}', description: 'Your personal impact metrics', keywords: ['my', 'impact', 'personal', 'contribution', 'measure'] },
  'peace-index':        { emoji: '\u{1F54A}', description: 'Community peace index', keywords: ['peace', 'index', 'harmony', 'conflict', 'measure'] },
  'inter-regional':     { emoji: '\u{1F310}', description: 'Inter-regional collaboration', keywords: ['regional', 'inter', 'collaborate', 'cross', 'border'] },
  'philanthropy':       { emoji: '\u{1F49D}', description: 'Philanthropy and giving', keywords: ['philanthropy', 'give', 'donate', 'charity', 'fund'] },
  'research':           { emoji: '\u{1F52C}', description: 'Community research projects', keywords: ['research', 'study', 'data', 'science', 'publish'] },

  // Personal
  'journal':            { emoji: '\u{1F4D3}', description: 'Personal journal', keywords: ['journal', 'write', 'diary', 'reflect', 'note'] },
  'vision-board':       { emoji: '\u{1F3AF}', description: 'Create your vision board', keywords: ['vision', 'goal', 'dream', 'aspire', 'future'] },
  'digital-wellbeing':  { emoji: '\u{1F4F1}', description: 'Digital wellbeing tracker', keywords: ['digital', 'screen', 'time', 'detox', 'balance'] },
  'prayer':             { emoji: '\u{1F64F}', description: 'Interfaith and prayer space', keywords: ['prayer', 'faith', 'spiritual', 'religion', 'interfaith'] },
};

// ─── Build Enriched Search Data ───

function buildSearchData(): SearchResult[] {
  const screens = getSearchableScreens();
  return screens.map(s => {
    const meta = SCREEN_META[s.key] || { emoji: '\u{1F4C4}', description: s.label, keywords: [] };
    return {
      key: s.key,
      label: s.label,
      category: s.category,
      view: s.view,
      emoji: meta.emoji,
      description: meta.description,
      keywords: meta.keywords,
    };
  });
}

// ─── Component ───

export function GlobalSearchScreen({ onClose, onNavigate }: Props & { onNavigate: (view: string) => void }) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount + auto-focus
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then(val => {
      if (val) {
        try { setRecentSearches(JSON.parse(val)); } catch {}
      }
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const allScreens = useMemo(() => buildSearchData(), []);

  // Perform search using deepLinks' searchScreens + keyword matching
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Base results from deepLinks search (matches label, category, key)
    let baseResults = q ? searchScreens(q) : [];

    // Also search by keywords in our extended meta
    if (q) {
      const keywordMatches = allScreens.filter(s =>
        s.keywords.some(kw => kw.includes(q)) &&
        !baseResults.some(br => br.key === s.key)
      );
      baseResults = [
        ...baseResults,
        ...keywordMatches.map(km => ({ key: km.key, label: km.label, category: km.category, view: km.view })),
      ];
    }

    // Enrich with metadata
    let enriched: SearchResult[] = baseResults.map(r => {
      const meta = SCREEN_META[r.key] || { emoji: '\u{1F4C4}', description: r.label, keywords: [] };
      return { ...r, emoji: meta.emoji, description: meta.description, keywords: meta.keywords };
    });

    // Apply category filter
    if (selectedCategory !== 'all') {
      enriched = enriched.filter(r => r.category === selectedCategory);
    }

    return enriched;
  }, [query, selectedCategory, allScreens]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [results]);

  const saveRecentSearch = useCallback(async (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  const handleResultPress = useCallback((item: SearchResult) => {
    saveRecentSearch(item.label);
    onNavigate(item.view);
  }, [onNavigate, saveRecentSearch]);

  const handleSuggestionPress = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
      paddingVertical: 12, gap: 12,
    },
    searchBar: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.bg.card, borderRadius: 14, paddingHorizontal: 14,
      height: 48,
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: {
      flex: 1, color: t.text.primary, fontSize: 16, padding: 0,
    },
    clearBtn: { padding: 4 },
    clearText: { color: t.text.muted, fontSize: 18 },
    closeBtn: { paddingVertical: 4 },
    closeBtnText: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },

    // Category chips
    chipRow: { paddingHorizontal: 12, paddingBottom: 12 },
    chipScroll: { gap: 8, flexDirection: 'row' },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    chipActive: { backgroundColor: t.accent.blue },
    chipEmoji: { fontSize: 14 },
    chipLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    chipLabelActive: { color: '#fff' },

    // Empty state
    emptyContainer: { paddingHorizontal: 20, paddingTop: 16 },
    sectionHeader: {
      color: t.text.secondary, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginTop: 8,
    },
    suggestionChip: {
      backgroundColor: t.bg.card, paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12, marginRight: 8, marginBottom: 8,
    },
    suggestionText: { color: t.text.primary, fontSize: 14 },
    recentRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.bg.card,
    },
    recentIcon: { fontSize: 16, marginRight: 10, color: t.text.muted },
    recentText: { color: t.text.primary, fontSize: 15 },

    // Results
    resultsList: { flex: 1, paddingHorizontal: 16 },
    categoryHeader: {
      color: t.text.secondary, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1.5,
      marginTop: 20, marginBottom: 8, paddingLeft: 4,
    },
    resultRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.bg.card,
    },
    resultEmoji: { fontSize: 28, marginRight: 14, width: 36, textAlign: 'center' },
    resultContent: { flex: 1 },
    resultTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    resultName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    categoryBadge: {
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    },
    categoryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    resultDesc: { color: t.text.muted, fontSize: 13, lineHeight: 18 },
    resultArrow: { color: t.text.muted, fontSize: 18, marginLeft: 8 },

    // Count
    countText: {
      color: t.text.muted, fontSize: 12, textAlign: 'center',
      paddingVertical: 16,
    },
    noResults: { alignItems: 'center', paddingTop: 60 },
    noResultsEmoji: { fontSize: 48, marginBottom: 12 },
    noResultsTitle: { color: t.text.primary, fontSize: 18, fontWeight: '700' },
    noResultsSub: { color: t.text.muted, fontSize: 14, marginTop: 4 },

    demoTag: {
      backgroundColor: t.accent.purple + '20', paddingHorizontal: 8,
      paddingVertical: 2, borderRadius: 8, alignSelf: 'center', marginBottom: 4,
    },
    demoText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const renderEmpty = () => (
    <ScrollView style={s.emptyContainer}>
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <>
          <Text style={s.sectionHeader}>Recent Searches</Text>
          {recentSearches.map(term => (
            <TouchableOpacity
              key={term}
              style={s.recentRow}
              onPress={() => handleSuggestionPress(term)}
            >
              <Text style={s.recentIcon}>{'\u{1F552}'}</Text>
              <Text style={s.recentText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Popular Searches */}
      <Text style={[s.sectionHeader, { marginTop: 24 }]}>Popular Searches</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {POPULAR_SEARCHES.map(term => (
          <TouchableOpacity
            key={term}
            style={s.suggestionChip}
            onPress={() => handleSuggestionPress(term)}
          >
            <Text style={s.suggestionText}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.countText}>
        {allScreens.length} screens available to explore
      </Text>
    </ScrollView>
  );

  const renderNoResults = () => (
    <View style={s.noResults}>
      <Text style={s.noResultsEmoji}>{'\u{1F50D}'}</Text>
      <Text style={s.noResultsTitle}>No results found</Text>
      <Text style={s.noResultsSub}>Try a different keyword or category</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Demo mode indicator */}
      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      {/* Search Header */}
      <View style={s.header}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>{'\u{1F50D}'}</Text>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search screens, categories, features..."
            placeholderTextColor={t.text.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={() => setQuery('')}>
              <Text style={s.clearText}>{'\u{2715}'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipRow}
        contentContainerStyle={s.chipScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.chip, selectedCategory === cat.key && s.chipActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={s.chipEmoji}>{cat.emoji}</Text>
            <Text style={[s.chipLabel, selectedCategory === cat.key && s.chipLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results or Empty State */}
      {!query.trim() ? (
        renderEmpty()
      ) : results.length === 0 ? (
        renderNoResults()
      ) : (
        <ScrollView style={s.resultsList} keyboardShouldPersistTaps="handled">
          {groupedResults.map(([category, items]) => (
            <View key={category}>
              <Text style={s.categoryHeader}>{category}</Text>
              {items.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={s.resultRow}
                  onPress={() => handleResultPress(item)}
                  activeOpacity={0.6}
                >
                  <Text style={s.resultEmoji}>{item.emoji}</Text>
                  <View style={s.resultContent}>
                    <View style={s.resultTop}>
                      <Text style={s.resultName}>{item.label}</Text>
                      <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] || t.accent.blue }]}>
                        <Text style={s.categoryBadgeText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={s.resultDesc}>{item.description}</Text>
                  </View>
                  <Text style={s.resultArrow}>{'\u{203A}'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <Text style={s.countText}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
