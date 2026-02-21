import {
    Check,
    Download,
    Edit2,
    Palette,
    Plus,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import logger from '../lib/logger';
import {
    Theme,
    ThemeColors,
    builtInThemes,
    createCustomTheme,
    exportTheme,
    importTheme,
    validateThemeColors,
} from '../lib/themes';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function ThemeCustomizer() {
  const {
    themeMode,
    setThemeMode,
    currentThemeId,
    setCurrentThemeId,
    customThemes,
    addCustomTheme,
    removeCustomTheme,
    updateCustomTheme,
  } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeType, setNewThemeType] = useState<'light' | 'dark'>('light');
  const [selectedBaseTheme, setSelectedBaseTheme] = useState<string>('light');

  const allThemes = [...builtInThemes, ...customThemes];

  // Filter themes based on current theme mode
  const filteredThemes = allThemes.filter(theme => {
    if (themeMode === 'system') {
      // When system mode, show all themes
      return true;
    }
    // Otherwise, only show themes matching the current mode
    return theme.type === themeMode;
  });

  const handleCreateTheme = () => {
    if (!newThemeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const baseTheme = allThemes.find(t => t.id === selectedBaseTheme);
    const newTheme = createCustomTheme(newThemeName, newThemeType, baseTheme);
    addCustomTheme(newTheme);
    setCurrentThemeId(newTheme.id);
    setIsCreating(false);
    setNewThemeName('');
  };

  const handleDeleteTheme = (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;

    removeCustomTheme(themeId);
    if (currentThemeId === themeId) {
      setCurrentThemeId('light');
    }
  };

  const handleExportTheme = (theme: Theme) => {
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const json = e.target?.result as string;
          const theme = importTheme(json);
          addCustomTheme(theme);
          setCurrentThemeId(theme.id);
          alert('Theme imported successfully!');
        } catch (error) {
          alert('Failed to import theme. Please check the file format.');
          logger.error('Failed to import theme', { error });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme({ ...theme });
  };

  const handleSaveEdit = () => {
    if (!editingTheme) return;

    if (!validateThemeColors(editingTheme.colors)) {
      alert('Please fill in all required color fields');
      return;
    }

    updateCustomTheme(editingTheme.id, editingTheme);
    setEditingTheme(null);
  };

  const updateEditingColor = (key: keyof ThemeColors, value: string) => {
    if (!editingTheme) return;
    setEditingTheme({
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Mode
          </CardTitle>
          <CardDescription>
            Choose between light, dark, or system theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(mode => (
              <Button
                key={mode}
                variant={themeMode === mode ? 'default' : 'outline'}
                onClick={() => setThemeMode(mode)}
                className="flex-1 capitalize"
              >
                {themeMode === mode && <Check className="mr-2 h-4 w-4" />}
                {mode}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card className={cn(themeMode === 'system' && 'opacity-60')}>
        <CardHeader>
          <CardTitle>Select Theme</CardTitle>
          <CardDescription>
            {themeMode === 'system'
              ? 'Theme selection is disabled while using System mode'
              : 'Choose from built-in or custom themes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
              themeMode === 'system' && 'pointer-events-none grayscale'
            )}
          >
            {filteredThemes.map(theme => (
              <div
                key={theme.id}
                className={cn(
                  'group relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md',
                  currentThemeId === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => setCurrentThemeId(theme.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {theme.type} {theme.isCustom && '• Custom'}
                    </p>
                  </div>
                  {currentThemeId === theme.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Color Preview */}
                <div className="mt-3 flex gap-1">
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: `hsl(${theme.colors.primary})` }}
                  />
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: `hsl(${theme.colors.secondary})` }}
                  />
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: `hsl(${theme.colors.accent})` }}
                  />
                </div>

                {/* Custom theme actions */}
                {theme.isCustom && (
                  <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        handleEditTheme(theme);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        handleExportTheme(theme);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteTheme(theme.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Custom Theme */}
      <Card
        className={cn(
          themeMode === 'system' && 'opacity-60 pointer-events-none'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Custom Themes
          </CardTitle>
          <CardDescription>Create and manage your own themes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCreating ? (
            <div className="flex gap-2">
              <Button onClick={() => setIsCreating(true)} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Create New Theme
              </Button>
              <Button onClick={handleImportTheme} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Theme
              </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="themeName">Theme Name</Label>
                <Input
                  id="themeName"
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  placeholder="My Custom Theme"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeType">Theme Type</Label>
                <select
                  id="themeType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newThemeType}
                  onChange={e =>
                    setNewThemeType(e.target.value as 'light' | 'dark')
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseTheme">Base Theme</Label>
                <select
                  id="baseTheme"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedBaseTheme}
                  onChange={e => setSelectedBaseTheme(e.target.value)}
                >
                  {builtInThemes
                    .filter(t => t.type === newThemeType)
                    .map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTheme} className="flex-1">
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewThemeName('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Editor Modal */}
      {editingTheme && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-auto">
            <CardHeader>
              <CardTitle>Edit Theme: {editingTheme.name}</CardTitle>
              <CardDescription>
                Customize theme colors (HSL format)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(editingTheme.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        value={value}
                        onChange={e =>
                          updateEditingColor(
                            key as keyof ThemeColors,
                            e.target.value
                          )
                        }
                        placeholder="0 0% 100%"
                      />
                      <div
                        className="h-10 w-10 shrink-0 rounded border"
                        style={{ background: `hsl(${value})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button onClick={() => setEditingTheme(null)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
