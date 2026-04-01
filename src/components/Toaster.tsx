import { Toaster as SonnerToaster } from 'sonner';
import { useStore } from '../store/useStore';

export function Toaster() {
  const themeMode = useStore((state) => state.themeMode);
  
  return (
    <SonnerToaster 
      position="bottom-right"
      theme={themeMode === 'dark' ? 'dark' : 'light'}
      richColors
      closeButton
    />
  );
}

export default Toaster;
