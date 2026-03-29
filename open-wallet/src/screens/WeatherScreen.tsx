/**
 * Community Weather Monitoring — Article I of The Human Constitution.
 *
 * "Climate awareness empowers communities to prepare, adapt, and protect
 * their most vulnerable members through shared environmental knowledge."
 *
 * Features:
 * - Current conditions (temperature, humidity, wind, air quality index)
 * - Community weather reports (crowd-sourced local observations)
 * - Severe weather alerts and warnings
 * - Seasonal climate data and trends
 * - Agricultural weather advisory (planting/harvest guidance)
 * - Air quality monitoring with health recommendations
 * - Demo: current 24C partly cloudy, AQI 42, 2 community reports, 1 advisory
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'current' | 'reports' | 'alerts' | 'agriculture';

interface WeatherCondition {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  icon: string;
  aqi: number;
  aqiLabel: string;
  uvIndex: number;
  visibility: number;
  pressure: number;
  dewPoint: number;
  sunrise: string;
  sunset: string;
}

interface CommunityReport {
  id: string;
  reporter: string;
  observation: string;
  location: string;
  timestamp: string;
  type: 'observation' | 'warning' | 'update';
  icon: string;
}

interface WeatherAlert {
  id: string;
  severity: 'info' | 'advisory' | 'watch' | 'warning';
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  affectedArea: string;
}

interface AgriAdvisory {
  id: string;
  crop: string;
  icon: string;
  advisory: string;
  action: string;
  urgency: 'low' | 'medium' | 'high';
  season: string;
}

interface SeasonalData {
  month: string;
  avgTemp: number;
  rainfall: number;
  avgHumidity: number;
}

const AQI_COLORS: Record<string, string> = {
  Good: '#22c55e',
  Moderate: '#eab308',
  'Unhealthy for Sensitive': '#f97316',
  Unhealthy: '#ef4444',
  'Very Unhealthy': '#7c3aed',
  Hazardous: '#991b1b',
};

const AQI_RECOMMENDATIONS: Record<string, string> = {
  Good: 'Air quality is satisfactory. Enjoy outdoor activities freely.',
  Moderate: 'Acceptable air quality. Unusually sensitive individuals should limit prolonged outdoor exertion.',
  'Unhealthy for Sensitive': 'Members of sensitive groups may experience health effects. Reduce prolonged outdoor exertion.',
  Unhealthy: 'Everyone may begin to experience health effects. Limit outdoor activities.',
  'Very Unhealthy': 'Health alert: everyone may experience more serious health effects. Avoid outdoor exertion.',
  Hazardous: 'Health emergency. Everyone should avoid all outdoor activities.',
};

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  advisory: '#eab308',
  watch: '#f97316',
  warning: '#ef4444',
};

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Info',
  advisory: 'Advisory',
  watch: 'Watch',
  warning: 'Warning',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const DEMO_CURRENT: WeatherCondition = {
  temperature: 24,
  feelsLike: 26,
  humidity: 58,
  windSpeed: 12,
  windDirection: 'NW',
  condition: 'Partly Cloudy',
  icon: '\u{26C5}',
  aqi: 42,
  aqiLabel: 'Good',
  uvIndex: 6,
  visibility: 14,
  pressure: 1013,
  dewPoint: 15,
  sunrise: '06:12',
  sunset: '18:47',
};

const DEMO_REPORTS: CommunityReport[] = [
  {
    id: 'RPT-001', reporter: 'Maria G.', observation: 'Light fog forming in the valley near River Road. Visibility dropping.',
    location: 'River Valley', timestamp: '08:15 today', type: 'observation', icon: '\u{1F32B}',
  },
  {
    id: 'RPT-002', reporter: 'James T.', observation: 'Strong gusts near the hilltop park. Estimate 30+ km/h. Trees swaying.',
    location: 'Hilltop Park', timestamp: '10:42 today', type: 'warning', icon: '\u{1F4A8}',
  },
];

const DEMO_ALERTS: WeatherAlert[] = [
  {
    id: 'ALT-001', severity: 'advisory', title: 'Heat Advisory',
    description: 'Temperatures expected to reach 35C by midweek. Stay hydrated and limit outdoor exposure during peak hours (11:00-15:00).',
    issuedAt: '2026-03-29 06:00', expiresAt: '2026-04-01 18:00',
    affectedArea: 'All community zones',
  },
];

const DEMO_AGRI: AgriAdvisory[] = [
  {
    id: 'AGR-001', crop: 'Spring Vegetables', icon: '\u{1F966}',
    advisory: 'Ideal planting window for leafy greens and root vegetables. Soil temperature has reached 12C.',
    action: 'Begin planting lettuce, spinach, carrots, and radishes this week.',
    urgency: 'medium', season: 'Spring',
  },
];

const DEMO_SEASONAL: SeasonalData[] = [
  { month: 'Jan', avgTemp: 8, rainfall: 65, avgHumidity: 72 },
  { month: 'Feb', avgTemp: 10, rainfall: 55, avgHumidity: 68 },
  { month: 'Mar', avgTemp: 14, rainfall: 48, avgHumidity: 62 },
  { month: 'Apr', avgTemp: 18, rainfall: 42, avgHumidity: 58 },
  { month: 'May', avgTemp: 22, rainfall: 35, avgHumidity: 54 },
  { month: 'Jun', avgTemp: 27, rainfall: 20, avgHumidity: 48 },
  { month: 'Jul', avgTemp: 30, rainfall: 12, avgHumidity: 44 },
  { month: 'Aug', avgTemp: 29, rainfall: 15, avgHumidity: 46 },
  { month: 'Sep', avgTemp: 25, rainfall: 28, avgHumidity: 52 },
  { month: 'Oct', avgTemp: 19, rainfall: 45, avgHumidity: 60 },
  { month: 'Nov', avgTemp: 13, rainfall: 58, avgHumidity: 66 },
  { month: 'Dec', avgTemp: 9, rainfall: 62, avgHumidity: 70 },
];

export function WeatherScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);
  const [tab, setTab] = useState<Tab>('current');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    bigTemp: { fontSize: 56, fontWeight: '200', color: t.text.primary, textAlign: 'center' },
    conditionText: { fontSize: 18, color: t.text.secondary, textAlign: 'center', marginBottom: 4 },
    conditionIcon: { fontSize: 48, textAlign: 'center', marginBottom: 4 },
    feelsLike: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginBottom: 16 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    detailCell: { width: '47%', backgroundColor: t.bg.card, borderRadius: 12, padding: 12 },
    detailIcon: { fontSize: 18, marginBottom: 4 },
    detailLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', marginBottom: 2 },
    detailVal: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    detailUnit: { color: t.text.muted, fontSize: 11 },
    aqiCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
    aqiValue: { fontSize: 36, fontWeight: '800', marginBottom: 2 },
    aqiLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    aqiRec: { color: t.text.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    reportCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    reportIcon: { fontSize: 22 },
    reportReporter: { color: t.text.primary, fontSize: 13, fontWeight: '700' },
    reportTime: { color: t.text.muted, fontSize: 10 },
    reportText: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    reportLocation: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    alertCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
    alertTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
    alertDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 18, marginBottom: 8 },
    alertMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
    advisoryCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    advisoryCrop: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
    advisoryText: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginBottom: 6 },
    advisoryAction: { color: t.text.primary, fontSize: 12, fontWeight: '600', lineHeight: 18 },
    seasonRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 8, height: 80 },
    seasonBar: { flex: 1, borderRadius: 3, minHeight: 4 },
    seasonLabel: { color: t.text.muted, fontSize: 9, textAlign: 'center', marginTop: 2 },
    seasonBarContainer: { flex: 1, alignItems: 'center' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    sunRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    sunItem: { alignItems: 'center' },
    sunIcon: { fontSize: 22, marginBottom: 2 },
    sunTime: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    sunLabel: { color: t.text.muted, fontSize: 10 },
  }), [t]);

  const current = demoMode ? DEMO_CURRENT : null;
  const reports = demoMode ? DEMO_REPORTS : [];
  const alerts = demoMode ? DEMO_ALERTS : [];
  const agriAdvisories = demoMode ? DEMO_AGRI : [];
  const seasonal = demoMode ? DEMO_SEASONAL : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'current', label: 'Current' },
    { key: 'reports', label: 'Reports' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'agriculture', label: 'Agriculture' },
  ];

  const maxTemp = useMemo(() => Math.max(...seasonal.map(s => s.avgTemp), 1), [seasonal]);
  const maxRain = useMemo(() => Math.max(...seasonal.map(s => s.rainfall), 1), [seasonal]);

  const renderCurrent = () => {
    if (!current) {
      return <Text style={st.empty}>Weather data unavailable. Enable demo mode to see sample data.</Text>;
    }

    const aqiColor = AQI_COLORS[current.aqiLabel] || t.text.muted;
    const aqiRec = AQI_RECOMMENDATIONS[current.aqiLabel] || '';

    return (
      <>
        <Text style={st.conditionIcon}>{current.icon}</Text>
        <Text style={st.bigTemp}>{current.temperature}{'\u00B0'}C</Text>
        <Text style={st.conditionText}>{current.condition}</Text>
        <Text style={st.feelsLike}>Feels like {current.feelsLike}{'\u00B0'}C</Text>

        <View style={st.detailGrid}>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{1F4A7}'}</Text>
            <Text style={st.detailLabel}>Humidity</Text>
            <Text style={st.detailVal}>{current.humidity}<Text style={st.detailUnit}>%</Text></Text>
          </View>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{1F4A8}'}</Text>
            <Text style={st.detailLabel}>Wind</Text>
            <Text style={st.detailVal}>{current.windSpeed} <Text style={st.detailUnit}>km/h {current.windDirection}</Text></Text>
          </View>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{2600}'}</Text>
            <Text style={st.detailLabel}>UV Index</Text>
            <Text style={st.detailVal}>{current.uvIndex} <Text style={st.detailUnit}>{current.uvIndex <= 2 ? 'Low' : current.uvIndex <= 5 ? 'Moderate' : 'High'}</Text></Text>
          </View>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{1F441}'}</Text>
            <Text style={st.detailLabel}>Visibility</Text>
            <Text style={st.detailVal}>{current.visibility} <Text style={st.detailUnit}>km</Text></Text>
          </View>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{1F321}'}</Text>
            <Text style={st.detailLabel}>Pressure</Text>
            <Text style={st.detailVal}>{current.pressure} <Text style={st.detailUnit}>hPa</Text></Text>
          </View>
          <View style={st.detailCell}>
            <Text style={st.detailIcon}>{'\u{1F4A7}'}</Text>
            <Text style={st.detailLabel}>Dew Point</Text>
            <Text style={st.detailVal}>{current.dewPoint}{'\u00B0'}<Text style={st.detailUnit}>C</Text></Text>
          </View>
        </View>

        <View style={st.card}>
          <View style={st.sunRow}>
            <View style={st.sunItem}>
              <Text style={st.sunIcon}>{'\u{1F305}'}</Text>
              <Text style={st.sunTime}>{current.sunrise}</Text>
              <Text style={st.sunLabel}>Sunrise</Text>
            </View>
            <View style={st.sunItem}>
              <Text style={st.sunIcon}>{'\u{1F307}'}</Text>
              <Text style={st.sunTime}>{current.sunset}</Text>
              <Text style={st.sunLabel}>Sunset</Text>
            </View>
          </View>
        </View>

        <Text style={st.section}>Air Quality</Text>
        <View style={st.aqiCard}>
          <Text style={[st.aqiValue, { color: aqiColor }]}>{current.aqi}</Text>
          <Text style={[st.aqiLabel, { color: aqiColor }]}>{current.aqiLabel}</Text>
          <Text style={st.aqiRec}>{aqiRec}</Text>
        </View>
      </>
    );
  };

  const renderReports = () => {
    if (reports.length === 0) {
      return <Text style={st.empty}>No community weather reports yet. Be the first to share an observation.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Crowd-sourced weather observations from your community. Local knowledge fills the gaps between sensors.
        </Text>
        <Text style={st.section}>Recent Reports ({reports.length})</Text>
        {reports.map(report => (
          <View key={report.id} style={st.reportCard}>
            <View style={st.reportHeader}>
              <Text style={st.reportIcon}>{report.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.reportReporter}>{report.reporter}</Text>
                <Text style={st.reportTime}>{report.timestamp}</Text>
              </View>
              {report.type === 'warning' && (
                <View style={[st.badge, { backgroundColor: '#f97316' }]}>
                  <Text style={st.badgeText}>WARNING</Text>
                </View>
              )}
            </View>
            <Text style={st.reportText}>{report.observation}</Text>
            <Text style={st.reportLocation}>{'\u{1F4CD}'} {report.location}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderAlerts = () => {
    if (alerts.length === 0) {
      return <Text style={st.empty}>No active weather alerts. All clear.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Severe weather alerts and warnings for your community. Stay informed, stay safe.
        </Text>
        {alerts.map(alert => (
          <View key={alert.id} style={[st.alertCard, { backgroundColor: SEVERITY_COLORS[alert.severity] }]}>
            <View style={st.row}>
              <Text style={st.alertTitle}>{alert.title}</Text>
              <View style={[st.badge, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <Text style={st.badgeText}>{SEVERITY_LABELS[alert.severity].toUpperCase()}</Text>
              </View>
            </View>
            <Text style={st.alertDesc}>{alert.description}</Text>
            <Text style={st.alertMeta}>Issued: {alert.issuedAt} | Expires: {alert.expiresAt}</Text>
            <Text style={st.alertMeta}>Area: {alert.affectedArea}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderAgriculture = () => (
    <>
      <Text style={st.subtitle}>
        Agricultural weather guidance for your community. Local climate data to help plan planting, watering, and harvest.
      </Text>

      {agriAdvisories.length > 0 && (
        <>
          <Text style={st.section}>Active Advisories</Text>
          {agriAdvisories.map(adv => (
            <View key={adv.id} style={st.advisoryCard}>
              <View style={st.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 22 }}>{adv.icon}</Text>
                  <Text style={st.advisoryCrop}>{adv.crop}</Text>
                </View>
                <View style={[st.badge, { backgroundColor: URGENCY_COLORS[adv.urgency] }]}>
                  <Text style={st.badgeText}>{adv.urgency.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={st.advisoryText}>{adv.advisory}</Text>
              <View style={st.divider} />
              <Text style={st.label}>Recommended Action</Text>
              <Text style={st.advisoryAction}>{adv.action}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={st.section}>Temperature Trend ({'\u00B0'}C)</Text>
      <View style={st.card}>
        <View style={st.seasonRow}>
          {seasonal.map(s => (
            <View key={s.month} style={st.seasonBarContainer}>
              <View style={[st.seasonBar, {
                height: Math.max((s.avgTemp / maxTemp) * 60, 4),
                backgroundColor: s.avgTemp >= 25 ? t.accent.red : s.avgTemp >= 15 ? t.accent.yellow : t.accent.blue,
              }]} />
              <Text style={st.seasonLabel}>{s.month}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={st.section}>Rainfall (mm)</Text>
      <View style={st.card}>
        <View style={st.seasonRow}>
          {seasonal.map(s => (
            <View key={s.month} style={st.seasonBarContainer}>
              <View style={[st.seasonBar, {
                height: Math.max((s.rainfall / maxRain) * 60, 4),
                backgroundColor: t.accent.blue,
              }]} />
              <Text style={st.seasonLabel}>{s.month}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={st.section}>Seasonal Summary</Text>
      <View style={st.card}>
        {seasonal.map(s => (
          <View key={s.month} style={st.row}>
            <Text style={[st.label, { width: 30 }]}>{s.month}</Text>
            <Text style={st.val}>{s.avgTemp}{'\u00B0'}C</Text>
            <Text style={st.val}>{s.rainfall}mm</Text>
            <Text style={st.val}>{s.avgHumidity}%</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Weather</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <View style={st.tabRow}>
          {tabs.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[st.tab, tab === key && st.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[st.tabText, tab === key && st.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'current' && renderCurrent()}
        {tab === 'reports' && renderReports()}
        {tab === 'alerts' && renderAlerts()}
        {tab === 'agriculture' && renderAgriculture()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
