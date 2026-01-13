import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useStore } from '../store/useStore';

export function Privacy() {
  const { setCurrentPage } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentPage('settings')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">
          Last updated: January 14, 2026
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Privacy Matters</CardTitle>
          <CardDescription>
            Luna is designed with privacy in mind. We collect minimal data and give you full control.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            Luna is a desktop API client that runs entirely on your computer. Your API requests, 
            responses, collections, and environments are stored locally on your device and are 
            <strong> never sent to our servers</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Data Collection */}
      <Card>
        <CardHeader>
          <CardTitle>What We Collect (When Telemetry is Enabled)</CardTitle>
          <CardDescription>
            Optional crash reports and usage analytics to improve Luna
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p>
            When telemetry is enabled (the default), we collect anonymous data to help us 
            improve Luna. You can disable this at any time in Settings → Privacy.
          </p>
          
          <h4 className="font-semibold mt-4">Crash Reports</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Error messages and stack traces when the app crashes</li>
            <li>Operating system and architecture (e.g., macOS ARM64)</li>
            <li>Luna, Electron, and Chrome versions</li>
            <li>Anonymous session ID (not linked to your identity)</li>
          </ul>

          <h4 className="font-semibold mt-4">Usage Analytics</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Feature usage counts (which features are popular)</li>
            <li>Session duration and page navigation patterns</li>
            <li>Performance metrics (how fast features load)</li>
          </ul>

          <h4 className="font-semibold mt-4">What We Don't Collect</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>API URLs, headers, or request bodies</strong></li>
            <li><strong>API responses or data returned from your servers</strong></li>
            <li><strong>Collection names or request names</strong></li>
            <li><strong>Environment variables or secrets</strong></li>
            <li><strong>Any personally identifiable information (PII)</strong></li>
            <li><strong>IP addresses</strong> (Sentry anonymizes these)</li>
          </ul>
        </CardContent>
      </Card>

      {/* How We Use Data */}
      <Card>
        <CardHeader>
          <CardTitle>How We Use This Data</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Fix bugs:</strong> Crash reports help us identify and fix issues quickly
            </li>
            <li>
              <strong>Improve UX:</strong> Usage patterns help us prioritize features users actually use
            </li>
            <li>
              <strong>Optimize performance:</strong> Performance metrics help us find and fix slow areas
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Third Parties */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>We use <strong>Sentry</strong> for error tracking and performance monitoring.</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Sentry is a trusted error tracking service used by thousands of companies</li>
            <li>Data is transmitted securely over HTTPS</li>
            <li>Sentry automatically strips IP addresses from events</li>
            <li>We do not share your data with any other third parties</li>
          </ul>
          <p className="mt-4">
            <a 
              href="https://sentry.io/privacy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Read Sentry's Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Control</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p>You have full control over your data:</p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Opt out anytime:</strong> Disable telemetry in Settings → Privacy & Data
            </li>
            <li>
              <strong>Local data:</strong> All your API data is stored locally on your device
            </li>
            <li>
              <strong>Delete everything:</strong> Uninstall Luna to remove all local data
            </li>
          </ul>

          <p className="text-sm text-muted-foreground mt-4">
            When you disable telemetry, no data is sent to Sentry. Crash reports and 
            analytics are completely turned off.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            If you have any questions about this privacy policy or our data practices, 
            please contact us:
          </p>
          <p className="mt-2">
            <a 
              href="mailto:yrathod33@gmail.com"
              className="text-primary hover:underline"
            >
              yrathod33@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Changes to Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            We may update this privacy policy from time to time. We will notify you of 
            any changes by updating the "Last updated" date at the top of this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
