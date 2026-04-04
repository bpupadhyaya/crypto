import { fonts } from '../utils/theme';
/**
 * Error Boundary — Catches React crashes and shows a recovery screen.
 *
 * Instead of a blank screen, the user sees:
 * - "Something went wrong" message
 * - "Try Again" button (resets the component tree)
 * - "Go Home" button (navigates to home tab)
 * - "Report Issue" button (opens GitHub issues)
 * - Expandable error details (for developers)
 *
 * Wrap the root layout with this boundary to catch all unhandled errors.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Linking,
} from 'react-native';

const GITHUB_ISSUES_URL = 'https://github.com/bpupadhyaya/crypto/issues/new';

interface Props {
  children: ReactNode;
  /** Optional fallback to render instead of default error screen */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log to console for development
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleTryAgain = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = (): void => {
    // Reset error state — the app will re-render from the root
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReportIssue = (): void => {
    const { error, errorInfo } = this.state;
    const title = encodeURIComponent(`Crash: ${error?.message ?? 'Unknown error'}`);
    const body = encodeURIComponent(
      [
        '## Crash Report',
        '',
        `**Error:** ${error?.message ?? 'Unknown'}`,
        '',
        '**Stack:**',
        '```',
        error?.stack?.slice(0, 500) ?? 'No stack trace',
        '```',
        '',
        '**Component Stack:**',
        '```',
        errorInfo?.componentStack?.slice(0, 500) ?? 'No component stack',
        '```',
        '',
        '**Steps to reproduce:**',
        '1. ',
        '',
        '**Device/OS:**',
        '',
      ].join('\n')
    );
    Linking.openURL(`${GITHUB_ISSUES_URL}?title=${title}&body=${body}`);
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, errorInfo, showDetails } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error. You can try again or go back to the home screen.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={this.handleTryAgain}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleGoHome}>
            <Text style={styles.secondaryBtnText}>Go Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={this.handleReportIssue}>
            <Text style={styles.linkBtnText}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.detailsToggle} onPress={this.toggleDetails}>
            <Text style={styles.detailsToggleText}>
              {showDetails ? 'Hide Details' : 'Show Error Details'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
              <Text style={styles.detailsLabel}>Error:</Text>
              <Text style={styles.detailsText} selectable>
                {error?.message ?? 'Unknown error'}
              </Text>

              {error?.stack && (
                <>
                  <Text style={styles.detailsLabel}>Stack Trace:</Text>
                  <Text style={styles.detailsCode} selectable>
                    {error.stack}
                  </Text>
                </>
              )}

              {errorInfo?.componentStack && (
                <>
                  <Text style={styles.detailsLabel}>Component Stack:</Text>
                  <Text style={styles.detailsCode} selectable>
                    {errorInfo.componentStack}
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 48,
    fontWeight: fonts.bold,
    color: '#ef4444',
    marginBottom: 16,
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    overflow: 'hidden',
  },
  title: {
    color: '#f0f0f5',
    fontSize: 22,
    fontWeight: fonts.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: fonts.bold,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#f0f0f5',
    fontSize: 16,
    fontWeight: fonts.semibold,
  },
  linkBtn: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  linkBtnText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: fonts.semibold,
  },
  detailsToggle: {
    paddingVertical: 8,
  },
  detailsToggleText: {
    color: '#606070',
    fontSize: 13,
    fontWeight: fonts.semibold,
  },
  detailsScroll: {
    maxHeight: 200,
    width: '100%',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  detailsContent: {
    padding: 16,
  },
  detailsLabel: {
    color: '#a0a0b0',
    fontSize: 12,
    fontWeight: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 12,
  },
  detailsText: {
    color: '#ef4444',
    fontSize: 13,
    lineHeight: 18,
  },
  detailsCode: {
    color: '#a0a0b0',
    fontSize: 11,
    fontFamily: 'Courier',
    lineHeight: 16,
  },
});
