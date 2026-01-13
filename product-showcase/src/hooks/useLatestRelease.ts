import { useEffect, useState } from 'react';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
}

interface LatestReleaseData {
  mac: string;
  windows: string;
  linux: string;
  releaseUrl: string; // URL to the release page on GitHub
  version: string;
  loading: boolean;
  error: Error | null;
}

const GITHUB_REPO = 'yogeshhrathod/Anayas2.0';
const DEFAULT_URLS = {
  mac: `https://github.com/${GITHUB_REPO}/releases/latest/download/Luna-mac.dmg`,
  windows: `https://github.com/${GITHUB_REPO}/releases/latest/download/Luna-win.exe`,
  linux: `https://github.com/${GITHUB_REPO}/releases/latest/download/Luna-linux.AppImage`,
  releaseUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
};

export function useLatestRelease() {
  const [data, setData] = useState<LatestReleaseData>({
    mac: DEFAULT_URLS.mac,
    windows: DEFAULT_URLS.windows,
    linux: DEFAULT_URLS.linux,
    releaseUrl: DEFAULT_URLS.releaseUrl,
    version: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=1`);
        if (!response.ok) {
          throw new Error('Failed to fetch releases');
        }
        
        const releases: Release[] = await response.json();
        const latestRelease = releases[0];

        if (latestRelease) {
          const assets = latestRelease.assets;
          
          // Find assets using case-insensitive partial matching
          const macAsset = assets.find(a => a.name.endsWith('.dmg') && !a.name.includes('blockmap'));
          const winAsset = assets.find(a => a.name.endsWith('.exe') && !a.name.includes('blockmap'));
          const linuxAsset = assets.find(a => a.name.endsWith('.AppImage') && !a.name.includes('blockmap'));

          setData({
            mac: macAsset?.browser_download_url || DEFAULT_URLS.mac,
            windows: winAsset?.browser_download_url || DEFAULT_URLS.windows,
            linux: linuxAsset?.browser_download_url || DEFAULT_URLS.linux,
            releaseUrl: latestRelease.html_url,
            version: latestRelease.tag_name,
            loading: false,
            error: null,
          });
        } else {
            setData(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Error fetching latest release:', err);
        setData(prev => ({ ...prev, loading: false, error: err as Error }));
      }
    };

    fetchLatestRelease();
  }, []);

  return data;
}
