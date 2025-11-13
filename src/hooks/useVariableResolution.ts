/**
 * useVariableResolution - Hook for resolving environment variables in text
 * 
 * Provides real-time variable resolution with collection and global context
 * Supports {{var}}, {{collection.var}}, {{global.var}}, {{$dynamic}} syntax
 * Returns resolved text and list of unresolved variables
 */

import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export interface VariableInfo {
  name: string;
  value: string;
  scope: 'collection' | 'global' | 'dynamic';
  originalText: string; // The full {{variable}} string
}

export interface ResolutionResult {
  resolved: string;
  unresolved: string[];
  variables: VariableInfo[];
}

const VARIABLE_REGEX = /\{\{(\$)?(\w+\.)?(\w+)\}\}/g;

/**
 * Resolves dynamic/system variables
 */
function resolveDynamicVariable(variableName: string): string {
  switch (variableName) {
    case 'timestamp':
      // Unix timestamp in seconds
      return Math.floor(Date.now() / 1000).toString();
    
    case 'randomInt':
      // Random integer between 0 and 999999
      return Math.floor(Math.random() * 1000000).toString();
    
    case 'guid':
    case 'uuid':
      // UUID v4 (simple implementation)
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    
    case 'randomEmail':
      // Random email address for testing
      const randomPart = Math.random().toString(36).substring(2, 15);
      return `${randomPart}@example.com`;
    
    default:
      return '';
  }
}

export function useVariableResolution(text: string): ResolutionResult {
  const { currentEnvironment, selectedRequest, collections } = useStore();

  return useMemo(() => {
    if (!text || typeof text !== 'string') {
      return { resolved: text || '', unresolved: [], variables: [] };
    }

    // Get global environment variables
    const globalVariables = currentEnvironment?.variables || {};

    // Get collection variables if request belongs to a collection
    let collectionVariables: Record<string, string> = {};
    if (selectedRequest?.collectionId) {
      const collection = collections.find(c => c.id === selectedRequest.collectionId);
      if (collection?.environments && collection.activeEnvironmentId) {
        const activeEnv = collection.environments.find(
          e => e.id === collection.activeEnvironmentId
        );
        if (activeEnv) {
          collectionVariables = activeEnv.variables || {};
        }
      }
    }

    const unresolved: string[] = [];
    const variables: VariableInfo[] = [];
    let lastIndex = 0;
    let resolved = '';

    VARIABLE_REGEX.lastIndex = 0;
    let match;
    let matchCount = 0;

    while ((match = VARIABLE_REGEX.exec(text)) !== null) {
      matchCount++;
      const [fullMatch, isDynamic, prefix, variableName] = match;
      const matchIndex = match.index;
      const matchLength = fullMatch.length;

      // Add text before this match
      resolved += text.substring(lastIndex, matchIndex);
      lastIndex = matchIndex + matchLength;

      let value = '';
      let scope: 'collection' | 'global' | 'dynamic' = 'global';

      // Handle dynamic variables first
      if (isDynamic === '$') {
        value = resolveDynamicVariable(variableName);
        scope = 'dynamic';
        if (value === '') {
          unresolved.push(variableName);
        }
      } else {
        // Resolve variable based on prefix
        if (prefix === 'collection.') {
          value = collectionVariables[variableName] || '';
          scope = 'collection';
        } else if (prefix === 'global.') {
          value = globalVariables[variableName] || '';
          scope = 'global';
        } else {
          // No prefix - check collection first, then global
          value = collectionVariables[variableName] || globalVariables[variableName] || '';
          scope = collectionVariables[variableName] ? 'collection' : 'global';
        }

        if (value === '') {
          unresolved.push(variableName);
        }
      }

      variables.push({
        name: variableName,
        value,
        scope,
        originalText: fullMatch,
      });

      resolved += value;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      resolved += text.substring(lastIndex);
    }

    return { resolved, unresolved, variables };
  }, [text, currentEnvironment, selectedRequest, collections]);
}

/**
 * Dynamic/system variables available
 */
const DYNAMIC_VARIABLES: Array<{ name: string; description: string; scope: 'dynamic' }> = [
  { name: '$timestamp', description: 'Current Unix timestamp in seconds', scope: 'dynamic' },
  { name: '$randomInt', description: 'Random integer (0-999999)', scope: 'dynamic' },
  { name: '$guid', description: 'UUID v4', scope: 'dynamic' },
  { name: '$uuid', description: 'UUID v4 (alias)', scope: 'dynamic' },
  { name: '$randomEmail', description: 'Random email address', scope: 'dynamic' },
];

/**
 * Get all available variables with their values and scope
 */
export function useAvailableVariables(): Array<{
  name: string;
  value: string;
  scope: 'collection' | 'global' | 'dynamic';
}> {
  const { currentEnvironment, selectedRequest, collections } = useStore();

  return useMemo(() => {
    const result: Array<{ name: string; value: string; scope: 'collection' | 'global' | 'dynamic' }> = [];

    // Add dynamic variables first
    DYNAMIC_VARIABLES.forEach(dynamicVar => {
      // Get preview value for dynamic variables
      const previewValue = resolveDynamicVariable(dynamicVar.name.replace('$', ''));
      result.push({ 
        name: dynamicVar.name, 
        value: previewValue, 
        scope: 'dynamic' 
      });
    });

    // Add global environment variables
    if (currentEnvironment?.variables) {
      Object.entries(currentEnvironment.variables).forEach(([name, value]) => {
        result.push({ name, value, scope: 'global' });
      });
    }

    // Add collection environment variables if applicable
    if (selectedRequest?.collectionId) {
      const collection = collections.find(c => c.id === selectedRequest.collectionId);
      if (collection?.environments && collection.activeEnvironmentId) {
        const activeEnv = collection.environments.find(e => e.id === collection.activeEnvironmentId);
        if (activeEnv?.variables) {
          Object.entries(activeEnv.variables).forEach(([name, value]) => {
            result.push({ name, value, scope: 'collection' });
          });
        }
      }
    }

    return result;
  }, [currentEnvironment, selectedRequest, collections]);
}

