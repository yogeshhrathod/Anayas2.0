/**
 * useClickOutside - Close dropdown/modal on click outside or Escape key
 * 
 * Provides click-outside and escape key handling with:
 * - Ref-based click detection
 * - Escape key support
 * - Conditional activation
 * - Automatic cleanup
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * 
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 * 
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <Dropdown />}
 *   </div>
 * );
 * ```
 */

import { RefObject, useEffect } from 'react';

export interface UseClickOutsideOptions {
  /**
   * Whether to handle Escape key press
   * @default true
   */
  handleEscape?: boolean;
  /**
   * Whether to handle click outside
   * @default true
   */
  handleClickOutside?: boolean;
  /**
   * Additional condition to check before closing
   * @default () => true
   */
  shouldClose?: (event: MouseEvent | KeyboardEvent) => boolean;
}

/**
 * Hook to close a dropdown/modal when clicking outside or pressing Escape
 * 
 * @param ref - Ref to the element that should not trigger close
 * @param onClose - Callback to execute when close is triggered
 * @param isActive - Whether the hook should be active (e.g., dropdown is open)
 * @param options - Additional options for behavior customization
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T>,
  onClose: () => void,
  isActive: boolean = true,
  options: UseClickOutsideOptions = {}
): void {
  const {
    handleEscape = true,
    handleClickOutside = true,
    shouldClose = () => true,
  } = options;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldClose(e)) {
        onClose();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && shouldClose(e)) {
        onClose();
      }
    };

    if (handleEscape) {
      window.addEventListener('keydown', handleEscapeKey);
    }

    if (handleClickOutside) {
      document.addEventListener('mousedown', handleClick);
    }

    // Always return cleanup for robustness
    return () => {
      if (handleEscape) {
        window.removeEventListener('keydown', handleEscapeKey);
      }
      if (handleClickOutside) {
        document.removeEventListener('mousedown', handleClick);
      }
    };
  }, [isActive, handleEscape, handleClickOutside, onClose, ref, shouldClose]);
}

