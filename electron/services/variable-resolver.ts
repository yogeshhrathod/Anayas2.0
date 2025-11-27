/**
 * Variable Resolver Service
 *
 * Handles resolution of environment variables with support for:
 * - {{variableName}} - Resolves with precedence (collection > global)
 * - {{collection.variableName}} - Explicitly uses collection variable
 * - {{global.variableName}} - Explicitly uses global variable
 * - {{$timestamp}} - Current Unix timestamp in seconds
 * - {{$randomInt}} - Random integer (0-999999)
 * - {{$guid}} - UUID v4
 * - {{$randomEmail}} - Random email address
 *
 * Priority rules:
 * 1. Dynamic variables ({{$...}}) - resolved first
 * 2. Explicit prefix ({{collection.var}} or {{global.var}}) - use specified scope
 * 3. No prefix ({{var}}) - check collection first, then global
 * 4. Not found - return empty string
 */

import { createLogger } from './logger';
import { randomUUID } from 'crypto';

const logger = createLogger('variable-resolver');

export interface VariableContext {
  globalVariables: Record<string, string>;
  collectionVariables?: Record<string, string>;
}

export class VariableResolver {
  /**
   * Resolves variables in a string
   * Supports {{var}}, {{collection.var}}, {{global.var}}, {{$dynamic}} syntax
   */
  resolve(text: string, context: VariableContext): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Match {{variableName}}, {{collection.variableName}}, {{global.variableName}}, {{$dynamicVar}}
    const variableRegex = /\{\{(\$)?(\w+\.)?(\w+)\}\}/g;

    return text.replace(
      variableRegex,
      (match, isDynamic, prefix, variableName) => {
        let resolvedValue = '';

        // Handle dynamic variables first ({{$timestamp}}, {{$randomInt}}, etc.)
        if (isDynamic === '$') {
          resolvedValue = this.resolveDynamicVariable(variableName);
          if (resolvedValue !== '') {
            return resolvedValue;
          }
        }

        // Handle explicit prefixes
        if (prefix === 'collection.') {
          resolvedValue = this.resolveCollectionVariable(variableName, context);
        } else if (prefix === 'global.') {
          resolvedValue = this.resolveGlobalVariable(variableName, context);
        } else {
          // No prefix - check collection first, then global
          resolvedValue = this.resolveWithPrecedence(variableName, context);
        }

        if (resolvedValue === '') {
          logger.warn(`Variable not resolved: ${variableName}`, {
            match,
            context,
          });
        }

        return resolvedValue;
      }
    );
  }

  /**
   * Resolves dynamic/system variables
   */
  private resolveDynamicVariable(variableName: string): string {
    switch (variableName) {
      case 'timestamp':
        // Unix timestamp in seconds
        return Math.floor(Date.now() / 1000).toString();

      case 'randomInt':
        // Random integer between 0 and 999999
        return Math.floor(Math.random() * 1000000).toString();

      case 'guid':
      case 'uuid':
        // UUID v4
        return randomUUID();

      case 'randomEmail': {
        // Random email address for testing
        const randomPart = Math.random().toString(36).substring(2, 15);
        return `${randomPart}@example.com`;
      }

      default:
        return '';
    }
  }

  /**
   * Resolves variables in an object recursively
   */
  resolveObject(obj: any, context: VariableContext): any {
    if (typeof obj === 'string') {
      return this.resolve(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveObject(item, context));
    }

    if (obj !== null && typeof obj === 'object') {
      const resolved: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveObject(value, context);
      }
      return resolved;
    }

    return obj;
  }

  /**
   * Resolve variable with collection precedence (collection > global)
   */
  private resolveWithPrecedence(
    variableName: string,
    context: VariableContext
  ): string {
    // Check collection first, then global
    if (
      context.collectionVariables &&
      context.collectionVariables[variableName]
    ) {
      return context.collectionVariables[variableName];
    }

    if (context.globalVariables && context.globalVariables[variableName]) {
      return context.globalVariables[variableName];
    }

    return '';
  }

  /**
   * Resolve variable from collection scope only
   */
  private resolveCollectionVariable(
    variableName: string,
    context: VariableContext
  ): string {
    if (
      context.collectionVariables &&
      context.collectionVariables[variableName]
    ) {
      return context.collectionVariables[variableName];
    }
    return '';
  }

  /**
   * Resolve variable from global scope only
   */
  private resolveGlobalVariable(
    variableName: string,
    context: VariableContext
  ): string {
    if (context.globalVariables && context.globalVariables[variableName]) {
      return context.globalVariables[variableName];
    }
    return '';
  }

  /**
   * Preview resolution for UI hints (returns unresolved variables)
   */
  previewResolution(
    text: string,
    context: VariableContext
  ): {
    resolved: string;
    unresolved: string[];
  } {
    if (!text || typeof text !== 'string') {
      return { resolved: text, unresolved: [] };
    }

    const unresolved: string[] = [];
    const variableRegex = /\{\{(\$)?(\w+\.)?(\w+)\}\}/g;

    const resolved = text.replace(
      variableRegex,
      (match, isDynamic, prefix, variableName) => {
        let resolvedValue = '';

        // Handle dynamic variables
        if (isDynamic === '$') {
          resolvedValue = this.resolveDynamicVariable(variableName);
          if (resolvedValue !== '') {
            return resolvedValue;
          }
        }

        if (prefix === 'collection.') {
          resolvedValue = this.resolveCollectionVariable(variableName, context);
        } else if (prefix === 'global.') {
          resolvedValue = this.resolveGlobalVariable(variableName, context);
        } else {
          resolvedValue = this.resolveWithPrecedence(variableName, context);
        }

        if (resolvedValue === '') {
          unresolved.push(variableName);
        }

        return resolvedValue;
      }
    );

    return { resolved, unresolved };
  }
}

export const variableResolver = new VariableResolver();
