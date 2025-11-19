/**
 * Sidebar types and interfaces
 * Used for managing sidebar section state and configuration
 */

/**
 * Sidebar section identifier
 * Used to uniquely identify each sidebar section
 */
export type SidebarSectionId = 'unsaved' | 'collections';

/**
 * Sidebar state stored in database
 * Contains which sections are expanded and their order
 */
export interface SidebarState {
  /** Array of section IDs that are expanded */
  expandedSections: SidebarSectionId[];
  
  /** Order of sections (for future customization) */
  sectionOrder?: SidebarSectionId[];
}

/**
 * Default sidebar state
 * Collections section expanded by default
 */
export const DEFAULT_SIDEBAR_STATE: SidebarState = {
  expandedSections: ['collections'],
  sectionOrder: ['unsaved', 'collections'],
};

/**
 * Sidebar section configuration
 * Defines metadata for each sidebar section
 */
export interface SidebarSectionConfig {
  /** Unique section identifier */
  id: SidebarSectionId;
  
  /** Display title */
  title: string;
  
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Default expanded state */
  defaultExpanded?: boolean;
}

