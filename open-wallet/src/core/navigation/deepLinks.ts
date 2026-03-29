/**
 * Deep Linking System — Connect 246 screens into a unified system.
 *
 * Routes:
 *   openwallet://screen/{screenName}
 *   openwallet://screen/{screenName}?param=value
 *   openwallet://tx/{txHash}
 *   openwallet://uid/{universalId}
 *   openwallet://proposal/{proposalId}
 *   openwallet://gratitude/{txHash}
 *
 * Used by:
 *   - Push notifications → open relevant screen
 *   - In-app cross-references (e.g., GratitudeWall → GratitudeScreen)
 *   - QR codes → deep link to specific content
 *   - External links → open app to specific screen
 */

// ─── Screen Registry ───

/** All navigable screens mapped to their SettingsView key */
export const SCREEN_REGISTRY: Record<string, { view: string; label: string; category: string }> = {
  // Core wallet
  'home': { view: 'main', label: 'Home', category: 'wallet' },
  'send': { view: 'main', label: 'Send', category: 'wallet' },
  'receive': { view: 'main', label: 'Receive', category: 'wallet' },
  'swap': { view: 'main', label: 'Swap', category: 'wallet' },

  // Identity & Privacy
  'universal-id': { view: 'uid', label: 'Universal ID', category: 'identity' },
  'identity': { view: 'identity', label: 'Identity & Reputation', category: 'identity' },
  'guardian': { view: 'guardian', label: 'Guardian Accounts', category: 'identity' },
  'cross-chain-id': { view: 'cross-chain-id', label: 'Cross-Chain Identity', category: 'identity' },
  'reputation': { view: 'reputation', label: 'Reputation Dashboard', category: 'identity' },
  'zk-proof': { view: 'zk-proof', label: 'ZK Proofs', category: 'privacy' },
  'data-sovereignty': { view: 'data-sovereignty', label: 'Data Sovereignty', category: 'privacy' },
  'pqc-key': { view: 'pqc-key', label: 'PQC Key Management', category: 'privacy' },

  // Value Channels
  'value-channels': { view: 'value-channels', label: 'Value Channels', category: 'chain' },
  'living-ledger': { view: 'ledger', label: 'Living Ledger', category: 'chain' },
  'gratitude': { view: 'gratitude', label: 'Gratitude', category: 'chain' },
  'gratitude-wall': { view: 'gratitude-wall', label: 'Gratitude Wall', category: 'chain' },
  'gratitude-journal': { view: 'gratitude-journal', label: 'Gratitude Journal', category: 'chain' },
  'contribution-scores': { view: 'scores', label: 'Contribution Scores', category: 'chain' },
  'achievements': { view: 'achievements', label: 'Achievements', category: 'chain' },

  // Governance
  'governance': { view: 'governance', label: 'Governance', category: 'governance' },
  'dao': { view: 'dao', label: 'DAOs', category: 'governance' },
  'election': { view: 'election', label: 'Elections', category: 'governance' },
  'budget': { view: 'budget', label: 'Community Budget', category: 'governance' },
  'petition': { view: 'petition', label: 'Petitions', category: 'governance' },
  'debate': { view: 'debate', label: 'Debates', category: 'governance' },
  'civic-education': { view: 'civic-education', label: 'Civic Education', category: 'governance' },
  'voting-power': { view: 'voting-power', label: 'Voting Power', category: 'governance' },
  'youth-council': { view: 'youth-council', label: 'Youth Council', category: 'governance' },
  'micro-grants': { view: 'micro-grants', label: 'Micro-Grants', category: 'governance' },

  // Health & Wellness
  'wellness': { view: 'wellness', label: 'Wellness', category: 'health' },
  'health-emergency': { view: 'health-emergency', label: 'Health Emergency', category: 'health' },
  'mental-wellness': { view: 'mental-wellness', label: 'Mental Wellness', category: 'health' },
  'maternal-health': { view: 'maternal-health', label: 'Maternal Health', category: 'health' },
  'meditation': { view: 'meditation', label: 'Meditation', category: 'health' },
  'yoga': { view: 'yoga', label: 'Yoga', category: 'health' },
  'nutrition': { view: 'nutrition', label: 'Nutrition', category: 'health' },
  'sleep': { view: 'sleep', label: 'Sleep', category: 'health' },
  'sports': { view: 'sports', label: 'Sports & Fitness', category: 'health' },
  'allergy': { view: 'allergy', label: 'Allergy Management', category: 'health' },
  'recovery': { view: 'recovery', label: 'Recovery Support', category: 'health' },
  'first-aid': { view: 'first-aid', label: 'First Aid', category: 'health' },

  // Education
  'education-hub': { view: 'education-hub', label: 'Education Hub', category: 'education' },
  'curriculum': { view: 'curriculum', label: 'Curriculum', category: 'education' },
  'homeschool': { view: 'homeschool', label: 'Home School', category: 'education' },
  'library': { view: 'library', label: 'Library', category: 'education' },
  'tutor': { view: 'tutor', label: 'Peer Tutoring', category: 'education' },
  'stem': { view: 'stem', label: 'STEM', category: 'education' },
  'skill-verification': { view: 'skill-verification', label: 'Skill Verification', category: 'education' },
  'digital-literacy': { view: 'digital-literacy', label: 'Digital Literacy', category: 'education' },
  'book-club': { view: 'book-club', label: 'Book Clubs', category: 'education' },
  'apprenticeship': { view: 'apprenticeship', label: 'Apprenticeships', category: 'education' },
  'language-exchange': { view: 'language-exchange', label: 'Language Exchange', category: 'education' },
  'financial-literacy': { view: 'financial-literacy', label: 'Financial Literacy', category: 'education' },
  'public-speaking': { view: 'public-speaking', label: 'Public Speaking', category: 'education' },

  // Economy
  'job-board': { view: 'job-board', label: 'Job Board', category: 'economy' },
  'marketplace': { view: 'marketplace', label: 'Marketplace', category: 'economy' },
  'cooperative': { view: 'cooperative', label: 'Cooperatives', category: 'economy' },
  'time-bank': { view: 'time-bank', label: 'Time Bank', category: 'economy' },
  'barter': { view: 'barter', label: 'Barter Exchange', category: 'economy' },
  'farm-to-table': { view: 'farm-to-table', label: 'Farm to Table', category: 'economy' },
  'workshop': { view: 'workshop', label: 'Community Workshop', category: 'economy' },
  'innovation': { view: 'innovation', label: 'Innovation Hub', category: 'economy' },
  'insurance-pool': { view: 'insurance-pool', label: 'Insurance Pools', category: 'economy' },
  'supply-chain': { view: 'supply-chain', label: 'Supply Chain', category: 'economy' },
  'coworking': { view: 'coworking', label: 'Co-Working', category: 'economy' },
  'repair-cafe': { view: 'repair-cafe', label: 'Repair Cafe', category: 'economy' },
  'skill-swap': { view: 'skill-swap', label: 'Skill Swap', category: 'economy' },
  'networking': { view: 'networking', label: 'Networking', category: 'economy' },

  // Community
  'community-board': { view: 'community-board', label: 'Community Board', category: 'community' },
  'community-radio': { view: 'community-radio', label: 'Community Radio', category: 'community' },
  'community-projects': { view: 'community-projects', label: 'Community Projects', category: 'community' },
  'community-map': { view: 'community-map', label: 'Community Map', category: 'community' },
  'volunteer': { view: 'volunteer', label: 'Volunteer', category: 'community' },
  'volunteer-match': { view: 'volunteer-match', label: 'Volunteer Match', category: 'community' },
  'volunteer-abroad': { view: 'volunteer-abroad', label: 'Volunteer Abroad', category: 'community' },
  'neighbor-help': { view: 'neighbor-help', label: 'Neighbor Help', category: 'community' },
  'childcare': { view: 'childcare', label: 'Childcare', category: 'community' },
  'news': { view: 'news', label: 'Community News', category: 'community' },
  'feedback': { view: 'feedback', label: 'Feedback', category: 'community' },
  'calendar': { view: 'calendar', label: 'Calendar', category: 'community' },
  'neighborhood': { view: 'neighborhood', label: 'Neighborhood', category: 'community' },
  'cleanup-drive': { view: 'cleanup-drive', label: 'Cleanup Drives', category: 'community' },
  'storytelling': { view: 'storytelling', label: 'Storytelling', category: 'community' },
  'podcast': { view: 'podcast', label: 'Podcasts', category: 'community' },
  'pen-pal': { view: 'pen-pal', label: 'Pen Pals', category: 'community' },
  'pet-welfare': { view: 'pet-welfare', label: 'Pet Welfare', category: 'community' },
  'incident-report': { view: 'incident-report', label: 'Incident Reports', category: 'community' },

  // Culture & Arts
  'cultural-heritage': { view: 'cultural-heritage', label: 'Cultural Heritage', category: 'culture' },
  'art-studio': { view: 'art-studio', label: 'Art Studio', category: 'culture' },
  'music': { view: 'music', label: 'Music', category: 'culture' },
  'dance': { view: 'dance', label: 'Dance', category: 'culture' },
  'poetry': { view: 'poetry', label: 'Poetry', category: 'culture' },
  'photo': { view: 'photo', label: 'Photography', category: 'culture' },
  'film': { view: 'film', label: 'Film & Cinema', category: 'culture' },
  'cooking': { view: 'cooking', label: 'Cooking', category: 'culture' },
  'textile': { view: 'textile', label: 'Textile Arts', category: 'culture' },
  'games': { view: 'games', label: 'Games', category: 'culture' },
  'ceremony': { view: 'ceremony', label: 'Ceremonies', category: 'culture' },
  'elder-wisdom': { view: 'elder-wisdom', label: 'Elder Wisdom', category: 'culture' },
  'travel': { view: 'travel', label: 'Community Travel', category: 'culture' },

  // Nature & Environment
  'environmental': { view: 'environmental', label: 'Environmental Impact', category: 'nature' },
  'climate-action': { view: 'climate-action', label: 'Climate Action', category: 'nature' },
  'renewable-energy': { view: 'renewable-energy', label: 'Renewable Energy', category: 'nature' },
  'tree-planting': { view: 'tree-planting', label: 'Tree Planting', category: 'nature' },
  'wildlife': { view: 'wildlife', label: 'Wildlife', category: 'nature' },
  'habitat': { view: 'habitat', label: 'Habitat Restoration', category: 'nature' },
  'waste-management': { view: 'waste-management', label: 'Waste Management', category: 'nature' },
  'weather': { view: 'weather', label: 'Weather', category: 'nature' },
  'permaculture': { view: 'permaculture', label: 'Permaculture', category: 'nature' },
  'beekeeping': { view: 'beekeeping', label: 'Beekeeping', category: 'nature' },
  'gardening': { view: 'gardening', label: 'Gardening', category: 'nature' },
  'aquaponics': { view: 'aquaponics', label: 'Aquaponics', category: 'nature' },
  'soil': { view: 'soil', label: 'Soil Health', category: 'nature' },
  'seasonal': { view: 'seasonal', label: 'Seasonal Living', category: 'nature' },

  // Safety
  'safety-net': { view: 'safety-net', label: 'Safety Net', category: 'safety' },
  'disaster-response': { view: 'disaster-response', label: 'Disaster Response', category: 'safety' },
  'emergency-prep': { view: 'emergency-prep', label: 'Emergency Prep', category: 'safety' },
  'emergency-contacts': { view: 'emergency-contacts', label: 'Emergency Contacts', category: 'safety' },
  'child-safety': { view: 'child-safety', label: 'Child Safety', category: 'safety' },
  'conflict-prevention': { view: 'conflict-prevention', label: 'Conflict Prevention', category: 'safety' },
  'infrastructure': { view: 'infrastructure', label: 'Infrastructure', category: 'safety' },

  // Basic Needs
  'food-security': { view: 'food-security', label: 'Food Security', category: 'needs' },
  'water-sanitation': { view: 'water-sanitation', label: 'Water & Sanitation', category: 'needs' },
  'housing': { view: 'housing', label: 'Housing', category: 'needs' },
  'transport': { view: 'transport', label: 'Transport', category: 'needs' },
  'basic-needs': { view: 'basic-needs', label: 'Basic Needs', category: 'needs' },
  'needs-assessment': { view: 'needs-assessment', label: 'Needs Assessment', category: 'needs' },
  'resource-match': { view: 'resource-match', label: 'Resource Match', category: 'needs' },

  // Inclusion
  'disability-support': { view: 'disability-support', label: 'Disability Support', category: 'inclusion' },
  'immigration-support': { view: 'immigration-support', label: 'Newcomer Support', category: 'inclusion' },
  'legal-aid': { view: 'legal-aid', label: 'Legal Aid', category: 'inclusion' },
  'barrier-free': { view: 'barrier-free', label: 'Barrier-Free', category: 'inclusion' },
  'veteran': { view: 'veteran', label: 'Veteran Support', category: 'inclusion' },

  // Family & Life
  'family-tree': { view: 'family-tree', label: 'Family Tree', category: 'family' },
  'family-finance': { view: 'family-finance', label: 'Family Finance', category: 'family' },
  'parenting-stages': { view: 'parenting-stages', label: 'Parenting Stages', category: 'family' },
  'parenting-journey': { view: 'parenting-journey', label: 'Parenting Journey', category: 'family' },
  'eldercare': { view: 'eldercare', label: 'Eldercare', category: 'family' },
  'senior-activities': { view: 'senior-activities', label: 'Senior Activities', category: 'family' },
  'intergeneration': { view: 'intergeneration', label: 'Intergenerational', category: 'family' },
  'ancestry': { view: 'ancestry', label: 'Ancestry', category: 'family' },
  'relationship': { view: 'relationship', label: 'Relationships', category: 'family' },
  'teen': { view: 'teen', label: 'Teen Space', category: 'family' },
  'end-of-life': { view: 'end-of-life', label: 'End of Life', category: 'family' },
  'memorial': { view: 'memorial', label: 'Memorials', category: 'family' },
  'personal-timeline': { view: 'personal-timeline', label: 'Life Timeline', category: 'family' },

  // Support
  'grief-support': { view: 'grief-support', label: 'Grief Support', category: 'support' },
  'mediation': { view: 'mediation', label: 'Mediation', category: 'support' },
  'arbitration': { view: 'arbitration', label: 'Arbitration', category: 'support' },
  'appeal': { view: 'appeal', label: 'Appeal', category: 'support' },
  'correction': { view: 'correction', label: 'Corrections', category: 'support' },

  // Impact
  'global-impact': { view: 'global-impact', label: 'Global Impact', category: 'impact' },
  'my-impact': { view: 'my-impact', label: 'My Impact', category: 'impact' },
  'peace-index': { view: 'peace-index', label: 'Peace Index', category: 'impact' },
  'inter-regional': { view: 'inter-regional', label: 'Inter-Regional', category: 'impact' },
  'philanthropy': { view: 'philanthropy', label: 'Philanthropy', category: 'impact' },
  'research': { view: 'research', label: 'Research', category: 'impact' },

  // Personal
  'journal': { view: 'journal', label: 'Journal', category: 'personal' },
  'vision-board': { view: 'vision-board', label: 'Vision Board', category: 'personal' },
  'digital-wellbeing': { view: 'digital-wellbeing', label: 'Digital Wellbeing', category: 'personal' },
  'prayer': { view: 'prayer', label: 'Interfaith & Prayer', category: 'personal' },
};

// ─── Deep Link Parser ───

export interface DeepLink {
  screen: string;
  view: string;
  params: Record<string, string>;
}

/**
 * Parse a deep link URL into a screen target and parameters.
 * Example: "openwallet://screen/gratitude-wall?tx=abc123"
 */
export function parseDeepLink(url: string): DeepLink | null {
  try {
    // Remove scheme
    const path = url.replace(/^openwallet:\/\//, '');
    const [route, queryString] = path.split('?');
    const parts = route.split('/');

    // Parse query params
    const params: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }

    if (parts[0] === 'screen' && parts[1]) {
      const screenKey = parts[1];
      const entry = SCREEN_REGISTRY[screenKey];
      if (entry) {
        return { screen: screenKey, view: entry.view, params };
      }
    }

    // Special routes
    if (parts[0] === 'tx' && parts[1]) {
      return { screen: 'history', view: 'main', params: { txHash: parts[1] } };
    }
    if (parts[0] === 'uid' && parts[1]) {
      return { screen: 'universal-id', view: 'uid', params: { uid: parts[1] } };
    }
    if (parts[0] === 'proposal' && parts[1]) {
      return { screen: 'governance', view: 'governance', params: { proposalId: parts[1] } };
    }
    if (parts[0] === 'gratitude' && parts[1]) {
      return { screen: 'gratitude-wall', view: 'gratitude-wall', params: { txHash: parts[1] } };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build a deep link URL for a screen.
 */
export function buildDeepLink(screenKey: string, params?: Record<string, string>): string {
  let url = `openwallet://screen/${screenKey}`;
  if (params && Object.keys(params).length > 0) {
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    url += `?${qs}`;
  }
  return url;
}

// ─── Cross-Screen Navigation Links ───

/**
 * Common cross-screen links used throughout the app.
 * These enable screens to reference each other without tight coupling.
 */
export const CROSS_LINKS = {
  // From GratitudeWall → send gratitude
  sendGratitude: () => buildDeepLink('gratitude'),
  // From any OTK screen → Living Ledger
  viewLedger: () => buildDeepLink('living-ledger'),
  // From any community screen → volunteer
  volunteerNow: () => buildDeepLink('volunteer-match'),
  // From health screens → emergency
  emergencySOS: () => buildDeepLink('health-emergency'),
  // From governance → view proposals
  viewProposal: (id: string) => buildDeepLink('governance', { proposalId: id }),
  // From any screen → Peace Index
  peaceIndex: () => buildDeepLink('peace-index'),
  // From profile → reputation
  viewReputation: () => buildDeepLink('reputation'),
  // From any screen → community map
  findResources: () => buildDeepLink('community-map'),
  // From parenting → family tree
  familyTree: () => buildDeepLink('family-tree'),
  // From any screen → calendar
  viewCalendar: () => buildDeepLink('calendar'),
};

// ─── Search Index ───

/**
 * Get all screens as searchable entries for global search.
 */
export function getSearchableScreens(): Array<{ key: string; label: string; category: string; view: string }> {
  return Object.entries(SCREEN_REGISTRY).map(([key, entry]) => ({
    key,
    label: entry.label,
    category: entry.category,
    view: entry.view,
  }));
}

/**
 * Search screens by query string (fuzzy match on label and category).
 */
export function searchScreens(query: string): Array<{ key: string; label: string; category: string; view: string }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return getSearchableScreens()
    .filter(s => s.label.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.key.includes(q))
    .sort((a, b) => {
      // Exact label match first, then starts-with, then contains
      const aExact = a.label.toLowerCase() === q ? 0 : a.label.toLowerCase().startsWith(q) ? 1 : 2;
      const bExact = b.label.toLowerCase() === q ? 0 : b.label.toLowerCase().startsWith(q) ? 1 : 2;
      return aExact - bExact;
    });
}
