/**
 * AuthTab - Authentication configuration
 *
 * Handles authentication configuration with:
 * - Multiple auth types (none, bearer, basic, apikey)
 * - Type-specific form fields
 * - Secure password inputs
 * - Dynamic form rendering
 *
 * @example
 * ```tsx
 * <AuthTab
 *   requestData={requestData}
 *   setRequestData={setRequestData}
 * />
 * ```
 */

import React from 'react';
import { Card } from '../ui/card';
import { VariableInputUnified } from '../ui/variable-input-unified';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Shield } from 'lucide-react';
import { RequestFormData } from '../../types/forms';

export interface AuthTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
}

export const AuthTab: React.FC<AuthTabProps> = ({
  requestData,
  setRequestData,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Authentication
        </h3>
        <p className="text-xs text-muted-foreground">
          Configure authentication for your request
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="auth-type" className="text-sm font-medium">
            Authentication Type
          </Label>
          <Select
            value={requestData.auth.type}
            onValueChange={(value: 'none' | 'bearer' | 'basic' | 'apikey') =>
              setRequestData({
                ...requestData,
                auth: { ...requestData.auth, type: value },
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Authentication</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Authentication</SelectItem>
              <SelectItem value="apikey">API Key</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {requestData.auth.type === 'bearer' && (
          <Card className="p-4">
            <div className="space-y-3">
              <Label htmlFor="bearer-token" className="text-sm font-medium">
                Bearer Token
              </Label>
              <VariableInputUnified
                variant="overlay"
                value={requestData.auth.token || ''}
                onChange={token =>
                  setRequestData({
                    ...requestData,
                    auth: { ...requestData.auth, token },
                  })
                }
                placeholder="Enter your bearer token or use {{variable}}"
              />
              <p className="text-xs text-muted-foreground">
                Bearer [token] will be sent in the Authorization header
              </p>
            </div>
          </Card>
        )}

        {requestData.auth.type === 'basic' && (
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="basic-username" className="text-sm font-medium">
                  Username
                </Label>
                <VariableInputUnified
                  variant="overlay"
                  value={requestData.auth.username || ''}
                  onChange={username =>
                    setRequestData({
                      ...requestData,
                      auth: { ...requestData.auth, username },
                    })
                  }
                  placeholder="Enter username or use {{variable}}"
                />
              </div>
              <div>
                <Label htmlFor="basic-password" className="text-sm font-medium">
                  Password
                </Label>
                <VariableInputUnified
                  variant="overlay"
                  value={requestData.auth.password || ''}
                  onChange={password =>
                    setRequestData({
                      ...requestData,
                      auth: { ...requestData.auth, password },
                    })
                  }
                  placeholder="Enter password or use {{variable}}"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Credentials will be encoded and sent in the Authorization header
              </p>
            </div>
          </Card>
        )}

        {requestData.auth.type === 'apikey' && (
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="apikey-key" className="text-sm font-medium">
                  API Key
                </Label>
                <VariableInputUnified
                  variant="overlay"
                  value={requestData.auth.apiKey || ''}
                  onChange={apiKey =>
                    setRequestData({
                      ...requestData,
                      auth: { ...requestData.auth, apiKey },
                    })
                  }
                  placeholder="Enter your API key or use {{variable}}"
                />
              </div>
              <div>
                <Label htmlFor="apikey-header" className="text-sm font-medium">
                  Header Name
                </Label>
                <VariableInputUnified
                  variant="overlay"
                  value={requestData.auth.apiKeyHeader || 'X-API-Key'}
                  onChange={apiKeyHeader =>
                    setRequestData({
                      ...requestData,
                      auth: { ...requestData.auth, apiKeyHeader },
                    })
                  }
                  placeholder="e.g., X-API-Key, Authorization or use {{variable}}"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                API key will be sent in the specified header
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
