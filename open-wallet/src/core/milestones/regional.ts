/**
 * Regional Milestone Definitions — Culture-aware human value recognition.
 *
 * "Milestones may vary by region" — Human Constitution, Article III
 *
 * Different cultures celebrate different milestones. A first birthday
 * ceremony in Korea (doljanchi), a naming ceremony in West Africa,
 * a sacred thread ceremony in South Asia — all are valid milestones
 * that deserve recognition through OTK minting.
 *
 * Channels: nurture, education, health, community
 * Regions: global, south-asia, east-africa, west-africa, europe,
 *          east-asia, latin-america, middle-east, north-america,
 *          southeast-asia, oceania
 */

// ─── Types ───

export type MilestoneChannel = 'nurture' | 'education' | 'health' | 'community';

export type MilestoneRegion =
  | 'global'
  | 'south-asia'
  | 'east-africa'
  | 'west-africa'
  | 'europe'
  | 'east-asia'
  | 'latin-america'
  | 'middle-east'
  | 'north-america'
  | 'southeast-asia'
  | 'oceania';

export type VerificationMethod = 'self-report' | 'community-verify' | 'institutional';

export type MilestoneStatus = 'available' | 'submitted' | 'verified' | 'rejected';

export interface MilestoneDefinition {
  id: string;
  channel: MilestoneChannel;
  title: string;
  description: string;
  region: MilestoneRegion;
  mintAmount: number;               // suggested OTK mint amount
  verificationMethod: VerificationMethod;
}

export interface SubmittedMilestone {
  id: string;
  milestoneId: string;
  submittedAt: number;               // timestamp
  status: MilestoneStatus;
  evidence?: string;                 // description of evidence provided
  verifiedAt?: number;
  verifiedBy?: string;               // oracle address
}

// ─── Global Milestones (universal, every culture) ───

export const GLOBAL_MILESTONES: MilestoneDefinition[] = [
  // Nurture
  {
    id: 'n-birth',
    channel: 'nurture',
    title: 'Child born',
    description: 'A new life has entered the world under your care.',
    region: 'global',
    mintAmount: 100,
    verificationMethod: 'institutional',
  },
  {
    id: 'n-first-year',
    channel: 'nurture',
    title: 'First year of caregiving',
    description: 'One full year of dedicated caregiving — sleepless nights, first steps, first words.',
    region: 'global',
    mintAmount: 50,
    verificationMethod: 'self-report',
  },
  {
    id: 'n-five-years',
    channel: 'nurture',
    title: 'Five years of caregiving',
    description: 'Five years of shaping a human being — patience, love, sacrifice.',
    region: 'global',
    mintAmount: 200,
    verificationMethod: 'self-report',
  },
  {
    id: 'n-adoption',
    channel: 'nurture',
    title: 'Child adopted',
    description: 'Welcoming a child into your family through adoption.',
    region: 'global',
    mintAmount: 100,
    verificationMethod: 'institutional',
  },

  // Education
  {
    id: 'e-read',
    channel: 'education',
    title: 'Child reads at grade level',
    description: 'A child under your guidance can now read independently.',
    region: 'global',
    mintAmount: 30,
    verificationMethod: 'community-verify',
  },
  {
    id: 'e-primary',
    channel: 'education',
    title: 'Completed primary education',
    description: 'Child has completed primary school education.',
    region: 'global',
    mintAmount: 50,
    verificationMethod: 'institutional',
  },
  {
    id: 'e-secondary',
    channel: 'education',
    title: 'Completed secondary education',
    description: 'Child has completed secondary school education.',
    region: 'global',
    mintAmount: 75,
    verificationMethod: 'institutional',
  },
  {
    id: 'e-mentor-100',
    channel: 'education',
    title: 'Mentored 100 hours',
    description: 'Provided 100 hours of mentorship to others.',
    region: 'global',
    mintAmount: 40,
    verificationMethod: 'community-verify',
  },

  // Health
  {
    id: 'h-vaccine',
    channel: 'health',
    title: 'Child fully vaccinated',
    description: 'Child has completed all recommended vaccinations.',
    region: 'global',
    mintAmount: 25,
    verificationMethod: 'institutional',
  },
  {
    id: 'h-checkup',
    channel: 'health',
    title: 'Annual health checkup',
    description: 'Completed annual health checkup for child.',
    region: 'global',
    mintAmount: 10,
    verificationMethod: 'self-report',
  },
  {
    id: 'h-breastfeed-6mo',
    channel: 'health',
    title: 'Six months breastfeeding',
    description: 'Provided breastfeeding for six months as recommended by WHO.',
    region: 'global',
    mintAmount: 30,
    verificationMethod: 'self-report',
  },

  // Community
  {
    id: 'c-volunteer-100',
    channel: 'community',
    title: '100 hours community service',
    description: 'Contributed 100 hours of volunteer work in your community.',
    region: 'global',
    mintAmount: 40,
    verificationMethod: 'community-verify',
  },
  {
    id: 'c-elder-care',
    channel: 'community',
    title: 'Elder care provider',
    description: 'Providing ongoing care for an elderly community member.',
    region: 'global',
    mintAmount: 50,
    verificationMethod: 'community-verify',
  },
  {
    id: 'c-disaster-relief',
    channel: 'community',
    title: 'Disaster relief participation',
    description: 'Participated in disaster relief or emergency response.',
    region: 'global',
    mintAmount: 35,
    verificationMethod: 'community-verify',
  },
];

// ─── South Asia Milestones ───

export const SOUTH_ASIA_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'sa-annaprashan',
    channel: 'nurture',
    title: 'Annaprashan (First Rice)',
    description: 'Baby\'s first solid food ceremony — a celebration of growth.',
    region: 'south-asia',
    mintAmount: 20,
    verificationMethod: 'self-report',
  },
  {
    id: 'sa-mundan',
    channel: 'nurture',
    title: 'Mundan (First Haircut)',
    description: 'Ceremonial first haircut marking early childhood milestone.',
    region: 'south-asia',
    mintAmount: 15,
    verificationMethod: 'self-report',
  },
  {
    id: 'sa-upanayana',
    channel: 'education',
    title: 'Upanayana (Sacred Thread)',
    description: 'Initiation into formal education and spiritual learning.',
    region: 'south-asia',
    mintAmount: 30,
    verificationMethod: 'community-verify',
  },
  {
    id: 'sa-guru-dakshina',
    channel: 'education',
    title: 'Guru Dakshina',
    description: 'Formal acknowledgment and gratitude to one\'s teacher.',
    region: 'south-asia',
    mintAmount: 25,
    verificationMethod: 'self-report',
  },
  {
    id: 'sa-community-kitchen',
    channel: 'community',
    title: 'Langar / Community Kitchen',
    description: '50 hours serving free meals to the community.',
    region: 'south-asia',
    mintAmount: 30,
    verificationMethod: 'community-verify',
  },
];

// ─── East Africa Milestones ───

export const EAST_AFRICA_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'ea-naming',
    channel: 'nurture',
    title: 'Naming Ceremony',
    description: 'Community gathering to welcome and name the newborn.',
    region: 'east-africa',
    mintAmount: 20,
    verificationMethod: 'community-verify',
  },
  {
    id: 'ea-harambee',
    channel: 'community',
    title: 'Harambee Contribution',
    description: 'Participated in a community Harambee (collective fundraising).',
    region: 'east-africa',
    mintAmount: 25,
    verificationMethod: 'community-verify',
  },
  {
    id: 'ea-chama',
    channel: 'community',
    title: 'Chama Group Membership',
    description: 'Active member of a savings/investment group for 1+ years.',
    region: 'east-africa',
    mintAmount: 20,
    verificationMethod: 'community-verify',
  },
  {
    id: 'ea-madrasa',
    channel: 'education',
    title: 'Madrasa Completion',
    description: 'Completed religious/community education program.',
    region: 'east-africa',
    mintAmount: 30,
    verificationMethod: 'institutional',
  },
  {
    id: 'ea-community-health',
    channel: 'health',
    title: 'Community Health Worker',
    description: 'Serving as a community health volunteer for 6+ months.',
    region: 'east-africa',
    mintAmount: 40,
    verificationMethod: 'institutional',
  },
];

// ─── Europe Milestones ───

export const EUROPE_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'eu-parental-leave',
    channel: 'nurture',
    title: 'Parental Leave Completed',
    description: 'Completed dedicated parental leave for child care.',
    region: 'europe',
    mintAmount: 30,
    verificationMethod: 'self-report',
  },
  {
    id: 'eu-kindergarten',
    channel: 'education',
    title: 'Kindergarten Enrollment',
    description: 'Child enrolled in early childhood education.',
    region: 'europe',
    mintAmount: 15,
    verificationMethod: 'institutional',
  },
  {
    id: 'eu-gymnasium',
    channel: 'education',
    title: 'Gymnasium / Lycee Completion',
    description: 'Child completed upper secondary education.',
    region: 'europe',
    mintAmount: 50,
    verificationMethod: 'institutional',
  },
  {
    id: 'eu-verein',
    channel: 'community',
    title: 'Community Association Service',
    description: '100 hours of service in a local Verein or association.',
    region: 'europe',
    mintAmount: 30,
    verificationMethod: 'community-verify',
  },
  {
    id: 'eu-elderly-visit',
    channel: 'health',
    title: 'Elderly Visitation Program',
    description: 'Regular visits to isolated elderly community members (50+ visits).',
    region: 'europe',
    mintAmount: 35,
    verificationMethod: 'community-verify',
  },
];

// ─── East Asia Milestones ───

export const EAST_ASIA_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'easia-doljanchi',
    channel: 'nurture',
    title: 'First Birthday Celebration',
    description: 'Doljanchi (Korea), Zhuazhou (China) — first birthday ceremony.',
    region: 'east-asia',
    mintAmount: 20,
    verificationMethod: 'self-report',
  },
  {
    id: 'easia-shichi-go-san',
    channel: 'nurture',
    title: 'Shichi-Go-San (7-5-3)',
    description: 'Traditional celebration for children at ages 3, 5, and 7.',
    region: 'east-asia',
    mintAmount: 15,
    verificationMethod: 'self-report',
  },
  {
    id: 'easia-entrance-exam',
    channel: 'education',
    title: 'Entrance Exam Achievement',
    description: 'Child passed major entrance examination.',
    region: 'east-asia',
    mintAmount: 40,
    verificationMethod: 'institutional',
  },
];

// ─── Latin America Milestones ───

export const LATIN_AMERICA_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'la-quinceanera',
    channel: 'nurture',
    title: 'Quincea\u00f1era',
    description: 'Celebration of a girl\'s 15th birthday — coming of age.',
    region: 'latin-america',
    mintAmount: 25,
    verificationMethod: 'self-report',
  },
  {
    id: 'la-minga',
    channel: 'community',
    title: 'Minga Participation',
    description: 'Participated in collective community labor (Minga/Mutir\u00e3o).',
    region: 'latin-america',
    mintAmount: 20,
    verificationMethod: 'community-verify',
  },
  {
    id: 'la-promotor-salud',
    channel: 'health',
    title: 'Promotor de Salud',
    description: 'Serving as community health promoter for 6+ months.',
    region: 'latin-america',
    mintAmount: 40,
    verificationMethod: 'institutional',
  },
];

// ─── Registry ───

const ALL_REGIONAL_MILESTONES: MilestoneDefinition[] = [
  ...GLOBAL_MILESTONES,
  ...SOUTH_ASIA_MILESTONES,
  ...EAST_AFRICA_MILESTONES,
  ...EUROPE_MILESTONES,
  ...EAST_ASIA_MILESTONES,
  ...LATIN_AMERICA_MILESTONES,
];

/**
 * Get all milestone definitions, optionally filtered by region and/or channel.
 */
export function getMilestones(options?: {
  region?: MilestoneRegion;
  channel?: MilestoneChannel;
}): MilestoneDefinition[] {
  let result = ALL_REGIONAL_MILESTONES;
  if (options?.region && options.region !== 'global') {
    result = result.filter((m) => m.region === options.region || m.region === 'global');
  }
  if (options?.channel) {
    result = result.filter((m) => m.channel === options.channel);
  }
  return result;
}

/**
 * Get milestone by ID.
 */
export function getMilestoneById(id: string): MilestoneDefinition | undefined {
  return ALL_REGIONAL_MILESTONES.find((m) => m.id === id);
}

/**
 * Get all available regions.
 */
export function getAvailableRegions(): MilestoneRegion[] {
  return ['global', 'south-asia', 'east-africa', 'west-africa', 'europe', 'east-asia', 'latin-america', 'middle-east', 'north-america', 'southeast-asia', 'oceania'];
}

/**
 * Get all channels.
 */
export function getChannels(): MilestoneChannel[] {
  return ['nurture', 'education', 'health', 'community'];
}

/**
 * Get display info for a channel.
 */
export function getChannelDisplay(channel: MilestoneChannel): { icon: string; color: string; label: string } {
  switch (channel) {
    case 'nurture': return { icon: '\u{1F49B}', color: '#f59e0b', label: 'Nurture' };
    case 'education': return { icon: '\u{1F4DA}', color: '#3b82f6', label: 'Education' };
    case 'health': return { icon: '\u{1FA7A}', color: '#22c55e', label: 'Health' };
    case 'community': return { icon: '\u{1F91D}', color: '#8b5cf6', label: 'Community' };
  }
}

/**
 * Get display name for a region.
 */
export function getRegionDisplay(region: MilestoneRegion): string {
  const names: Record<MilestoneRegion, string> = {
    'global': 'Global',
    'south-asia': 'South Asia',
    'east-africa': 'East Africa',
    'west-africa': 'West Africa',
    'europe': 'Europe',
    'east-asia': 'East Asia',
    'latin-america': 'Latin America',
    'middle-east': 'Middle East',
    'north-america': 'North America',
    'southeast-asia': 'Southeast Asia',
    'oceania': 'Oceania',
  };
  return names[region] ?? region;
}
