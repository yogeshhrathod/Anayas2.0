import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import {
  DEFAULT_CODE_FONT_STACK,
  DEFAULT_UI_FONT_STACK,
} from '../constants/fonts';

// Removed Qualys-specific module codes

interface ValidationErrors {
  requestTimeout?: string;
  maxHistory?: string;
}

export function Settings() {
  const createLocalSettings = (incoming: Record<string, unknown>) => ({
    ...incoming,
    // Preserve actual values, only default to empty string if truly undefined
    uiFontFamily:
      incoming.uiFontFamily !== undefined ? incoming.uiFontFamily : '',
    codeFontFamily:
      incoming.codeFontFamily !== undefined ? incoming.codeFontFamily : '',
  });

  const { settings, setSettings, themeMode, currentThemeId, customThemes } =
    useStore();
  const [localSettings, setLocalSettings] = useState<Record<string, unknown>>(
    () => createLocalSettings(settings)
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const { success, error } = useToast();

  useEffect(() => {
    setLocalSettings(createLocalSettings(settings));
  }, [settings]);

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

  const validateAllSettings = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate requestTimeout
    const requestTimeout =
      typeof localSettings.requestTimeout === 'number'
        ? localSettings.requestTimeout
        : 30000;
    const requestTimeoutError = validateRequestTimeout(requestTimeout);
    if (requestTimeoutError) {
      errors.requestTimeout = requestTimeoutError;
    }

    // Validate maxHistory
    const maxHistory =
      typeof localSettings.maxHistory === 'number'
        ? localSettings.maxHistory
        : 100;
    const maxHistoryError = validateMaxHistory(maxHistory);
    if (maxHistoryError) {
      errors.maxHistory = maxHistoryError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate all settings before saving
    if (!validateAllSettings()) {
      error(
        'Validation failed',
        'Please fix all validation errors before saving'
      );
      return;
    }

    try {
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
              typeof value === 'string' ? value.trim() : String(value);
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

      success('Settings saved', 'Your changes have been saved');
    } catch (e: unknown) {
      console.error('Failed to save settings:', e);
      error('Save failed', 'Failed to save settings');
    }
  };

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
    } catch (e: unknown) {
      console.error('Failed to reset settings:', e);
      error('Reset failed', 'Failed to reset settings');
    }
  };

  const updateSetting = (key: string, value: unknown) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    // For font settings, update store immediately for live preview (but don't persist to DB yet)
    if (key === 'uiFontFamily' || key === 'codeFontFamily') {
      const trimmedValue =
        typeof value === 'string' ? value.trim() : String(value);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure application preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
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
                value={
                  typeof localSettings.uiFontFamily === 'string'
                    ? localSettings.uiFontFamily
                    : ''
                }
                onChange={e => updateSetting('uiFontFamily', e.target.value)}
                placeholder={DEFAULT_UI_FONT_STACK}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codeFontFamily">Code Font Family</Label>
              <Input
                id="codeFontFamily"
                type="text"
                value={
                  typeof localSettings.codeFontFamily === 'string'
                    ? localSettings.codeFontFamily
                    : ''
                }
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
                value={
                  typeof localSettings.requestTimeout === 'number'
                    ? localSettings.requestTimeout
                    : 30000
                }
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
                value={
                  typeof localSettings.maxHistory === 'number'
                    ? localSettings.maxHistory
                    : 100
                }
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
                checked={
                  typeof localSettings.followRedirects === 'boolean'
                    ? localSettings.followRedirects
                    : true
                }
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
                checked={
                  typeof localSettings.sslVerification === 'boolean'
                    ? localSettings.sslVerification
                    : true
                }
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
                checked={
                  typeof localSettings.autoSaveRequests === 'boolean'
                    ? localSettings.autoSaveRequests
                    : false
                }
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

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Application:</span>
            <span className="text-muted-foreground">Anayas</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Version:</span>
            <span className="text-muted-foreground">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Platform:</span>
            <span className="text-muted-foreground">Electron + React</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
