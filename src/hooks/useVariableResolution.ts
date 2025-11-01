/**
 * useVariableResolution - Hook for resolving environment variables in text
 * 
 * Provides real-time variable resolution with collection and global context
 * Supports {{var}}, {{collection.var}}, {{global.var}} syntax
 * Returns resolved text and list of unresolved variables
 */

import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export interface VariableInfo {
  name: string;
  value: string;
  scope: 'collection' | 'global';
  originalText: string; // The full {{variable}} string
}

export interface ResolutionResult {
  resolved: string;
  unresolved: string[];
  variables: VariableInfo[];
}

const VARIABLE_REGEX = /\{\{(\w+\.)?(\w+)\}\}/g;

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
      const [fullMatch, prefix, variableName] = match;
      const matchIndex = match.index;
      const matchLength = fullMatch.length;

      // Add text before this match
      resolved += text.substring(lastIndex, matchIndex);
      lastIndex = matchIndex + matchLength;

      let value = '';
      let scope: 'collection' | 'global' = 'global';

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
 * Get all available variables with their values and scope
 */
export function useAvailableVariables(): Array<{
  name: string;
  value: string;
  scope: 'collection' | 'global';
}> {
  const { currentEnvironment, selectedRequest, collections } = useStore();

  return useMemo(() => {
    const result: Array<{ name: string; value: string; scope: 'collection' | 'global' }> = [];

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

