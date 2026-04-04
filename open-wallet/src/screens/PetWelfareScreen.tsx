import { fonts } from '../utils/theme';
/**
 * Pet Welfare Screen — Community animal care, pet adoption, veterinary access.
 *
 * Article I: "Every living being in the community deserves care and protection.
 * Pet welfare reflects the compassion and health of a society."
 * — Human Constitution, Article I
 *
 * Features:
 * - Pet registry — community pets with vaccination status, microchip
 * - Pet adoption board — animals needing homes
 * - Veterinary resources — community vets, low-cost clinics, emergency vet
 * - Pet sitting exchange — community members help with pet care
 * - Lost & found — report lost/found animals
 * - Animal welfare reporting — report animal cruelty/neglect
 * - Demo: 3 adoption listings, 2 vets, 2 pet sitters, 1 lost report
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface AdoptionListing {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  description: string;
  vaccinated: boolean;
  microchipped: boolean;
  spayedNeutered: boolean;
  goodWith: string[];
  shelterName: string;
  postedDate: string;
  urgent: boolean;
}

interface VetResource {
  id: string;
  name: string;
  type: 'clinic' | 'emergency' | 'mobile' | 'low_cost';
  address: string;
  phone: string;
  hours: string;
  services: string[];
  acceptsOtk: boolean;
  rating: number;
}

interface PetSitter {
  id: string;
  name: string;
  experience: string;
  animalsAccepted: string[];
  availableDays: string;
  cotkRate: number;
  rating: number;
  completedSits: number;
  bio: string;
}

interface LostFoundReport {
  id: string;
  type: 'lost' | 'found';
  species: string;
  breed: string;
  color: string;
  description: string;
  lastSeenLocation: string;
  date: string;
  contactName: string;
  status: 'active' | 'reunited' | 'adopted';
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_ADOPTIONS: AdoptionListing[] = [
  {
    id: 'a1',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever Mix',
    age: '3 years',
    gender: 'Male',
    description: 'Friendly, well-trained golden mix. Great with kids and other dogs. Previous owner relocated and could not take him. Loves fetch and belly rubs.',
    vaccinated: true,
    microchipped: true,
    spayedNeutered: true,
    goodWith: ['Kids', 'Dogs', 'Cats'],
    shelterName: 'Riverside Animal Shelter',
    postedDate: '2026-03-25',
    urgent: false,
  },
  {
    id: 'a2',
    name: 'Luna',
    species: 'Cat',
    breed: 'Domestic Shorthair',
    age: '1 year',
    gender: 'Female',
    description: 'Sweet, playful tabby. Found as a stray kitten and fostered to health. Independent but affectionate when she trusts you. Indoor only recommended.',
    vaccinated: true,
    microchipped: false,
    spayedNeutered: true,
    goodWith: ['Adults', 'Cats'],
    shelterName: 'Paws & Whiskers Rescue',
    postedDate: '2026-03-20',
    urgent: false,
  },
  {
    id: 'a3',
    name: 'Rex',
    species: 'Dog',
    breed: 'German Shepherd',
    age: '6 years',
    gender: 'Male',
    description: 'Senior shepherd surrendered after owner passed away. Gentle giant, very loyal. Needs a calm home. Some arthritis — requires daily medication.',
    vaccinated: true,
    microchipped: true,
    spayedNeutered: true,
    goodWith: ['Adults', 'Dogs'],
    shelterName: 'Second Chance Animal Haven',
    postedDate: '2026-03-18',
    urgent: true,
  },
];

const DEMO_VETS: VetResource[] = [
  {
    id: 'v1',
    name: 'Community Pet Clinic',
    type: 'low_cost',
    address: '450 Oak Street, Suite 12',
    phone: '(555) 234-5678',
    hours: 'Mon-Fri 8am-6pm, Sat 9am-2pm',
    services: ['Vaccinations', 'Spay/Neuter', 'Dental', 'Wellness exams', 'Microchipping'],
    acceptsOtk: true,
    rating: 4.7,
  },
  {
    id: 'v2',
    name: 'Emergency Animal Hospital',
    type: 'emergency',
    address: '1200 Main Blvd',
    phone: '(555) 911-PETS',
    hours: '24/7 Emergency Care',
    services: ['Emergency surgery', 'Trauma care', 'Toxicology', 'Critical care', 'X-ray/Ultrasound'],
    acceptsOtk: false,
    rating: 4.9,
  },
];

const DEMO_SITTERS: PetSitter[] = [
  {
    id: 's1',
    name: 'Sarah M.',
    experience: '5 years pet sitting, certified in pet first aid',
    animalsAccepted: ['Dogs', 'Cats'],
    availableDays: 'Weekdays',
    cotkRate: 50,
    rating: 4.8,
    completedSits: 67,
    bio: 'Animal lover and stay-at-home parent. Your pets will be treated like family. Fenced yard available for dogs.',
  },
  {
    id: 's2',
    name: 'James K.',
    experience: '3 years, former vet tech',
    animalsAccepted: ['Dogs', 'Cats', 'Birds', 'Small animals'],
    availableDays: 'Weekends, evenings',
    cotkRate: 40,
    rating: 4.6,
    completedSits: 34,
    bio: 'Former veterinary technician. Comfortable with medication administration and special-needs animals.',
  },
];

const DEMO_LOST_FOUND: LostFoundReport[] = [
  {
    id: 'lf1',
    type: 'lost',
    species: 'Dog',
    breed: 'Beagle',
    color: 'Brown and white tricolor',
    description: 'Small beagle, 25 lbs, wearing a red collar with tags. Very friendly. Escaped from backyard on March 26. Answers to "Max". Please check your yards and garages.',
    lastSeenLocation: 'Corner of Elm St & 4th Ave',
    date: '2026-03-26',
    contactName: 'David R.',
    status: 'active',
  },
];

type Tab = 'adoption' | 'care' | 'vet' | 'lost-found';

export function PetWelfareScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('adoption');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const vetTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'low_cost': return 'Low Cost';
      case 'emergency': return 'Emergency';
      case 'mobile': return 'Mobile';
      case 'clinic': return 'Clinic';
      default: return type;
    }
  }, []);

  const vetTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'emergency': return '#FF3B30';
      case 'low_cost': return t.accent.green;
      case 'mobile': return t.accent.blue;
      default: return t.accent.purple;
    }
  }, [t]);

  const handleAdopt = useCallback((listing: AdoptionListing) => {
    Alert.alert(
      'Adoption Inquiry Sent',
      `Your inquiry about ${listing.name} has been sent to ${listing.shelterName}. They will contact you within 48 hours.`,
    );
  }, []);

  const handleBookSitter = useCallback((sitter: PetSitter) => {
    Alert.alert(
      'Booking Request Sent',
      `Your pet sitting request has been sent to ${sitter.name}. They will respond within 24 hours.`,
    );
  }, []);

  const handleReportLost = useCallback(() => {
    Alert.alert(
      'Report Submitted',
      'Your lost/found pet report has been posted to the community board. Nearby members will be notified.',
    );
  }, []);

  const handleReportWelfare = useCallback(() => {
    Alert.alert(
      'Welfare Report Filed',
      'Your animal welfare concern has been submitted. An animal welfare officer will investigate within 24-48 hours. Reports are confidential.',
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 4, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    adoptCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    adoptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    adoptName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    urgentBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    urgentText: { color: '#FF3B30', fontSize: fonts.xs, fontWeight: fonts.bold },
    adoptSpecies: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold },
    adoptDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginTop: 8 },
    adoptMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
    goodWithRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    goodWithChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    goodWithText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    adoptBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    adoptBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    vetCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    vetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    vetName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    vetTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    vetTypeText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    vetMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    vetServices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    serviceChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    serviceText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    ratingText: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold },
    otkBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    otkText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    sitterCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sitterName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    sitterBio: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginTop: 8 },
    sitterMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    sitterRate: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    statBox: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    bookBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    bookBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    lostCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    lostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    lostTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    lostTypeText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    lostDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginTop: 8 },
    lostMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    reportBtn: { backgroundColor: t.accent.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8 },
    reportBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    welfareBtn: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 8 },
    welfareBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 12, lineHeight: 18 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'adoption', label: 'Adoption' },
    { key: 'care', label: 'Care' },
    { key: 'vet', label: 'Vet' },
    { key: 'lost-found', label: 'Lost/Found' },
  ];

  // ─── Adoption Tab ───

  const renderAdoption = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F43E}'}</Text>
        <Text style={s.heroTitle}>Find Your New Best Friend</Text>
        <Text style={s.heroSubtitle}>
          Community animals looking for loving homes. Every adoption strengthens the bond between humans and animals in our community.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Available for Adoption</Text>
      {DEMO_ADOPTIONS.map((listing) => (
        <View key={listing.id} style={s.adoptCard}>
          <View style={s.adoptHeader}>
            <Text style={s.adoptName}>{listing.name}</Text>
            {listing.urgent && (
              <View style={s.urgentBadge}>
                <Text style={s.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
          <Text style={s.adoptSpecies}>{listing.species} — {listing.breed} — {listing.age} — {listing.gender}</Text>
          <Text style={s.adoptDesc}>{listing.description}</Text>
          <Text style={s.adoptMeta}>Shelter: {listing.shelterName} | Posted: {listing.postedDate}</Text>

          <View style={s.tagRow}>
            <View style={[s.tag, { backgroundColor: listing.vaccinated ? t.accent.green + '20' : t.accent.orange + '20' }]}>
              <Text style={[s.tagText, { color: listing.vaccinated ? t.accent.green : t.accent.orange }]}>
                {listing.vaccinated ? 'Vaccinated' : 'Needs Vaccines'}
              </Text>
            </View>
            <View style={[s.tag, { backgroundColor: listing.microchipped ? t.accent.green + '20' : t.bg.primary }]}>
              <Text style={[s.tagText, { color: listing.microchipped ? t.accent.green : t.text.muted }]}>
                {listing.microchipped ? 'Microchipped' : 'No Chip'}
              </Text>
            </View>
            <View style={[s.tag, { backgroundColor: listing.spayedNeutered ? t.accent.green + '20' : t.bg.primary }]}>
              <Text style={[s.tagText, { color: listing.spayedNeutered ? t.accent.green : t.text.muted }]}>
                {listing.spayedNeutered ? 'Spayed/Neutered' : 'Not Fixed'}
              </Text>
            </View>
          </View>

          <View style={s.goodWithRow}>
            {listing.goodWith.map((g, i) => (
              <View key={i} style={s.goodWithChip}>
                <Text style={s.goodWithText}>Good with {g}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.adoptBtn} onPress={() => handleAdopt(listing)}>
            <Text style={s.adoptBtnText}>Inquire About {listing.name}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Care Tab (Pet Sitting Exchange) ───

  const renderCare = () => (
    <>
      <Text style={s.sectionTitle}>Pet Sitting Exchange</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Community members helping with pet care. Pay with cOTK or exchange sits.
      </Text>

      {DEMO_SITTERS.map((sitter) => (
        <View key={sitter.id} style={s.sitterCard}>
          <Text style={s.sitterName}>{sitter.name}</Text>
          <Text style={s.sitterMeta}>{sitter.experience}</Text>
          <Text style={s.sitterBio}>{sitter.bio}</Text>
          <Text style={s.sitterMeta}>Available: {sitter.availableDays}</Text>
          <Text style={s.sitterMeta}>
            Accepts: {sitter.animalsAccepted.join(', ')}
          </Text>
          <Text style={s.sitterRate}>{sitter.cotkRate} cOTK / day</Text>

          <View style={s.statRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{sitter.completedSits}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: t.accent.orange }]}>{sitter.rating}</Text>
              <Text style={s.statLabel}>Rating</Text>
            </View>
          </View>

          <TouchableOpacity style={s.bookBtn} onPress={() => handleBookSitter(sitter)}>
            <Text style={s.bookBtnText}>Book {sitter.name}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={s.note}>
        Pet sitters earn cOTK for every completed sit. Build your reputation as a trusted community pet caretaker.
      </Text>
    </>
  );

  // ─── Vet Tab ───

  const renderVet = () => (
    <>
      <Text style={s.sectionTitle}>Veterinary Resources</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Community vets, low-cost clinics, and emergency care. Some accept OTK.
      </Text>

      {DEMO_VETS.map((vet) => (
        <View key={vet.id} style={s.vetCard}>
          <View style={s.vetHeader}>
            <Text style={s.vetName}>{vet.name}</Text>
            <View style={[s.vetTypeBadge, { backgroundColor: vetTypeColor(vet.type) + '20' }]}>
              <Text style={[s.vetTypeText, { color: vetTypeColor(vet.type) }]}>
                {vetTypeLabel(vet.type).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={s.vetMeta}>{vet.address}</Text>
          <Text style={s.vetMeta}>{vet.phone}</Text>
          <Text style={s.vetMeta}>{vet.hours}</Text>

          <View style={s.vetServices}>
            {vet.services.map((service, i) => (
              <View key={i} style={s.serviceChip}>
                <Text style={s.serviceText}>{service}</Text>
              </View>
            ))}
          </View>

          <View style={s.ratingRow}>
            <Text style={s.ratingText}>{vet.rating}</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm }}>/ 5.0</Text>
            {vet.acceptsOtk && (
              <View style={s.otkBadge}>
                <Text style={s.otkText}>ACCEPTS OTK</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Lost & Found Tab ───

  const lostFoundColor = useCallback((type: string) => {
    return type === 'lost' ? '#FF3B30' : t.accent.green;
  }, [t]);

  const statusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return t.accent.orange;
      case 'reunited': return t.accent.green;
      case 'adopted': return t.accent.blue;
      default: return t.text.muted;
    }
  }, [t]);

  const renderLostFound = () => (
    <>
      <Text style={s.sectionTitle}>Lost & Found Animals</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Help reunite lost pets with their families or report animals you have found.
      </Text>

      {DEMO_LOST_FOUND.map((report) => (
        <View key={report.id} style={s.lostCard}>
          <View style={s.lostHeader}>
            <Text style={s.adoptName}>{report.species} — {report.breed}</Text>
            <View style={[s.lostTypeBadge, { backgroundColor: lostFoundColor(report.type) + '20' }]}>
              <Text style={[s.lostTypeText, { color: lostFoundColor(report.type) }]}>
                {report.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={s.lostMeta}>Color: {report.color}</Text>
          <Text style={s.lostDesc}>{report.description}</Text>
          <Text style={s.lostMeta}>Last seen: {report.lastSeenLocation}</Text>
          <Text style={s.lostMeta}>Date: {report.date} | Contact: {report.contactName}</Text>

          <View style={[s.statusBadge, { backgroundColor: statusColor(report.status) + '20' }]}>
            <Text style={[s.statusText, { color: statusColor(report.status) }]}>
              {report.status.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.reportBtn} onPress={handleReportLost}>
        <Text style={s.reportBtnText}>Report Lost or Found Pet</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.welfareBtn} onPress={handleReportWelfare}>
        <Text style={s.welfareBtnText}>Report Animal Cruelty / Neglect</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        All welfare reports are confidential. If an animal is in immediate danger, call emergency services.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Pet Welfare</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
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
        {tab === 'adoption' && renderAdoption()}
        {tab === 'care' && renderCare()}
        {tab === 'vet' && renderVet()}
        {tab === 'lost-found' && renderLostFound()}
      </ScrollView>
    </SafeAreaView>
  );
}
