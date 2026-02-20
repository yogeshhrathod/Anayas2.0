import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import {
  DEFAULT_CODE_FONT_STACK,
  DEFAULT_UI_FONT_STACK,
} from '../constants/fonts';
import { useStore } from '../store/useStore';

// Removed Qualys-specific module codes

interface ValidationErrors {
  requestTimeout?: string;
  maxHistory?: string;
}

export function Settings() {
  const createLocalSettings = (incoming: Record<string, any>) => ({
    ...incoming,
    // Preserve actual values, only default to empty string if truly undefined
    uiFontFamily:
      incoming.uiFontFamily !== undefined ? incoming.uiFontFamily : '',
    codeFontFamily:
      incoming.codeFontFamily !== undefined ? incoming.codeFontFamily : '',
  });

  const {
    settings,
    setSettings,
    themeMode,
    currentThemeId,
    customThemes,
    appVersion,
  } = useStore();
  const [localSettings, setLocalSettings] = useState<Record<string, any>>(() =>
    createLocalSettings(settings)
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { success, error } = useToast();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    setLocalSettings(createLocalSettings(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Track if settings have actually changed from the saved state
  const hasUnsavedChanges = useCallback(() => {
    // Check local settings changes
    const savedSettings = createLocalSettings(settings);
    const localSettingsChanged =
      JSON.stringify(localSettings) !== JSON.stringify(savedSettings);

    // Check theme settings changes
    const savedThemeMode = settings.themeMode || 'system';
    const savedCurrentThemeId = settings.currentThemeId || 'light';
    let savedCustomThemes: any[] = [];
    try {
      savedCustomThemes = settings.customThemes
        ? typeof settings.customThemes === 'string'
          ? JSON.parse(settings.customThemes)
          : settings.customThemes
        : [];
    } catch (e) {
      savedCustomThemes = [];
    }

    const themeModeChanged = themeMode !== savedThemeMode;
    const currentThemeIdChanged = currentThemeId !== savedCurrentThemeId;
    const customThemesChanged =
      JSON.stringify(customThemes) !== JSON.stringify(savedCustomThemes);

    return (
      localSettingsChanged ||
      themeModeChanged ||
      currentThemeIdChanged ||
      customThemesChanged
    );
  }, [localSettings, settings, themeMode, currentThemeId, customThemes]);

  // Number validation helpers
  const validateRequestTimeout = (value: number): string | undefined => {
    if (isNaN(value) || value < 1000) {
      return 'Must be at least 1,000ms (1 second)';
    }
    if (value > 300000) {
      return 'Cannot exceed 300,000ms (5 minutes)';
    }
    return undefined;
  };

  const validateMaxHistory = (value: number): string | undefined => {
    if (isNaN(value) || value < 1) {
      return 'Must be at least 1';
    }
    if (value > 10000) {
      return 'Cannot exceed 10,000';
    }
    return undefined;
  };

  const performSave = useCallback(
    async (showToast = false) => {
      // Validate all settings before saving
      const errors: ValidationErrors = {};
      const requestTimeout = localSettings.requestTimeout || 30000;
      const requestTimeoutError = validateRequestTimeout(requestTimeout);
      if (requestTimeoutError) {
        errors.requestTimeout = requestTimeoutError;
      }
      const maxHistory = localSettings.maxHistory || 100;
      const maxHistoryError = validateMaxHistory(maxHistory);
      if (maxHistoryError) {
        errors.maxHistory = maxHistoryError;
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        if (showToast) {
          error(
            'Validation failed',
            'Please fix all validation errors before saving'
          );
        }
        return false;
      }

      try {
        setIsSaving(true);

        // Save theme settings
        await window.electronAPI.settings.set('themeMode', themeMode);
        await window.electronAPI.settings.set('currentThemeId', currentThemeId);
        await window.electronAPI.settings.set(
          'customThemes',
          JSON.stringify(customThemes)
        );

        // Save other settings
        for (const [key, value] of Object.entries(localSettings)) {
          if (
            !['themeMode', 'currentThemeId', 'customThemes', 'theme'].includes(
              key
            )
          ) {
            // For font settings, only save if not empty string (empty means use default)
            if (key === 'uiFontFamily' || key === 'codeFontFamily') {
              const trimmedValue =
                typeof value === 'string' ? value.trim() : value;
              if (trimmedValue && trimmedValue.length > 0) {
                await window.electronAPI.settings.set(key, trimmedValue);
              } else {
                // Remove the setting to use default
                await window.electronAPI.settings.set(key, undefined);
              }
            } else {
              await window.electronAPI.settings.set(key, value);
            }
          }
        }

        const updatedSettings = await window.electronAPI.settings.getAll();
        // Update store with DB settings (source of truth)
        setSettings(updatedSettings);
        // Force update local settings to reflect saved values
        setLocalSettings(createLocalSettings(updatedSettings));

        setLastSaved(new Date());

        if (showToast) {
          success('Settings saved', 'Your changes have been saved');
        }

        return true;
      } catch (e: any) {
        console.error('Failed to save settings:', e);
        if (showToast) {
          error('Save failed', 'Failed to save settings');
        }
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      localSettings,
      themeMode,
      currentThemeId,
      customThemes,
      setSettings,
      error,
      success,
    ]
  );

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?'))
      return;

    try {
      await window.electronAPI.settings.reset();
      const updatedSettings = await window.electronAPI.settings.getAll();
      setSettings(updatedSettings);
      setLocalSettings(createLocalSettings(updatedSettings));
      setValidationErrors({});
      success('Settings reset', 'All settings restored to defaults');
    } catch (e: any) {
      console.error('Failed to reset settings:', e);
      error('Reset failed', 'Failed to reset settings');
    }
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    // For font settings, update store immediately for live preview (but don't persist to DB yet)
    if (key === 'uiFontFamily' || key === 'codeFontFamily') {
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      // Update store immediately so FontProvider can apply the font
      // Use trimmed value if not empty, otherwise undefined to use default
      const fontValue =
        trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
      // Use current store state to ensure we don't overwrite other settings
      const currentSettings = useStore.getState().settings;
      setSettings({ ...currentSettings, [key]: fontValue });
    }

    // Clear validation error for this field when user starts typing
    if (validationErrors[key as keyof ValidationErrors]) {
      setValidationErrors({ ...validationErrors, [key]: undefined });
    }
  };

  // Auto-save effect: debounced save after 500ms of inactivity
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only auto-save if there are actual changes
    if (!hasUnsavedChanges()) {
      return;
    }

    // Set up debounced auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      await performSave(false);
    }, 500);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    localSettings,
    themeMode,
    currentThemeId,
    customThemes,
    hasUnsavedChanges,
    performSave,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure application preferences
            {lastSaved && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isSaving && (
              <span className="ml-2 text-xs text-muted-foreground">
                Saving...
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Theme Settings */}
      <ThemeCustomizer />

      {/* Font Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Font Settings</CardTitle>
          <CardDescription>Customize application fonts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uiFontFamily">UI Font Family</Label>
              <Input
                id="uiFontFamily"
                type="text"
                value={localSettings.uiFontFamily ?? ''}
                onChange={e => updateSetting('uiFontFamily', e.target.value)}
                placeholder={DEFAULT_UI_FONT_STACK}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codeFontFamily">Code Font Family</Label>
              <Input
                id="codeFontFamily"
                type="text"
                value={localSettings.codeFontFamily ?? ''}
                onChange={e => updateSetting('codeFontFamily', e.target.value)}
                placeholder={DEFAULT_CODE_FONT_STACK}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Testing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Testing Settings</CardTitle>
          <CardDescription>
            Configure default options for API requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestTimeout">Request Timeout (ms)</Label>
              <Input
                id="requestTimeout"
                type="number"
                min="1000"
                max="300000"
                step="1000"
                value={localSettings.requestTimeout || 30000}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  updateSetting('requestTimeout', val);
                }}
                onBlur={e => {
                  const val = parseInt(e.target.value);
                  const err = validateRequestTimeout(val);
                  if (err) {
                    setValidationErrors({
                      ...validationErrors,
                      requestTimeout: err,
                    });
                  }
                }}
                placeholder="30000"
                className={
                  validationErrors.requestTimeout ? 'border-red-500' : ''
                }
              />
              {validationErrors.requestTimeout && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{validationErrors.requestTimeout}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Range: 1,000ms to 300,000ms (5 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHistory">Max History Records</Label>
              <Input
                id="maxHistory"
                type="number"
                min="1"
                max="10000"
                value={localSettings.maxHistory || 100}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  updateSetting('maxHistory', val);
                }}
                onBlur={e => {
                  const val = parseInt(e.target.value);
                  const err = validateMaxHistory(val);
                  if (err) {
                    setValidationErrors({
                      ...validationErrors,
                      maxHistory: err,
                    });
                  }
                }}
                placeholder="100"
                className={validationErrors.maxHistory ? 'border-red-500' : ''}
              />
              {validationErrors.maxHistory && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{validationErrors.maxHistory}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Range: 1 to 10,000 records
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="followRedirects"
                checked={localSettings.followRedirects !== false}
                onChange={e =>
                  updateSetting('followRedirects', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="followRedirects" className="cursor-pointer">
                Follow redirects automatically
              </Label>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="sslVerification"
                checked={localSettings.sslVerification !== false}
                onChange={e =>
                  updateSetting('sslVerification', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="sslVerification" className="cursor-pointer">
                Verify SSL certificates
              </Label>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="autoSaveRequests"
                checked={localSettings.autoSaveRequests || false}
                onChange={e =>
                  updateSetting('autoSaveRequests', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="autoSaveRequests" className="cursor-pointer">
                Auto-save requests
              </Label>
            </div>
          </div>

          {/* Auto-save description */}
          <div className="text-xs text-muted-foreground">
            When enabled, request changes will be automatically saved every few
            seconds while editing
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>
            Control telemetry and data collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="telemetryEnabled"
              checked={localSettings.telemetryEnabled !== false}
              onChange={e =>
                updateSetting('telemetryEnabled', e.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="space-y-1">
              <Label
                htmlFor="telemetryEnabled"
                className="cursor-pointer font-medium"
              >
                Send anonymous usage data & crash reports
              </Label>
              <p className="text-xs text-muted-foreground">
                Help improve Luna by sending anonymous crash reports and usage
                analytics. No personal data, API content, or secrets are ever
                collected.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/50 p-3">
            <h4 className="text-sm font-medium mb-1">
              What we collect when enabled:
            </h4>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
              <li>Crash reports and error messages</li>
              <li>Feature usage counts (anonymized)</li>
              <li>Performance metrics</li>
              <li>OS type and app version</li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={() => {
                // Navigate to privacy page using currentPage
                const { setCurrentPage } = useStore.getState();
                setCurrentPage('privacy');
              }}
            >
              Read our Privacy Policy →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Application:</span>
            <span className="text-muted-foreground">Luna</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Version:</span>
            <span className="text-muted-foreground">{appVersion}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Platform:</span>
            <span className="text-muted-foreground">
              {navigator.userAgent.includes('Win')
                ? 'Windows'
                : navigator.userAgent.includes('Mac')
                  ? 'macOS'
                  : navigator.userAgent.includes('Linux')
                    ? 'Linux'
                    : 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
