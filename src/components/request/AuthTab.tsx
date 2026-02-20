/**
 * AuthTab - Authentication configuration
 *
 * Handles authentication configuration with:
 * - Multiple auth types (none, bearer, basic, apikey)
 * - Type-specific form fields
 * - Secure password inputs
 * - Dynamic form rendering
 */

import { Ban, Fingerprint, Key, Lock, Shield, ShieldCheck, Sparkles, User } from 'lucide-react';
import React from 'react';
import { RequestFormData } from '../../types/forms';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { TooltipProvider } from '../ui/tooltip';
import { VariableInputUnified } from '../ui/variable-input-unified';

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
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Premium Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
              <Fingerprint className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                Authentication
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                Secure your request with various auth methods
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="auth-type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Method
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
              <SelectTrigger className="w-48 h-9 rounded-xl border-border/40 bg-muted/20 text-xs font-bold transition-all hover:bg-muted/30">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Shield className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                <SelectItem value="none" className="text-xs font-bold">No Authentication</SelectItem>
                <SelectItem value="bearer" className="text-xs font-bold">Bearer Token</SelectItem>
                <SelectItem value="basic" className="text-xs font-bold">Basic Authentication</SelectItem>
                <SelectItem value="apikey" className="text-xs font-bold">API Key</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area - Card with Glassmorphism */}
        <div className="flex-1 min-h-[300px] bg-background/40 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl shadow-black/5 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-border/60 p-6">
          {requestData.auth.type === 'none' && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 gap-4 py-10 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-border/40 flex items-center justify-center bg-muted/5">
                <Ban className="h-10 w-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em]">Public Request</p>
                <p className="text-[11px] font-medium opacity-60 mt-1">No authentication required for this endpoint</p>
              </div>
            </div>
          )}

          {requestData.auth.type === 'bearer' && (
            <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-3.5 w-3.5 text-indigo-500" />
                  <Label className="text-xs font-bold uppercase tracking-tight">Bearer Token</Label>
                </div>
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
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-[10px] text-indigo-500/80 font-bold leading-relaxed">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Authentication details will be automatically injected into the Authorization header as: <code className="bg-indigo-500/10 px-1 rounded text-indigo-600">Bearer [token]</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {requestData.auth.type === 'basic' && (
            <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-indigo-500" />
                    <Label className="text-xs font-bold uppercase tracking-tight">Username</Label>
                  </div>
                  <VariableInputUnified
                    variant="overlay"
                    value={requestData.auth.username || ''}
                    onChange={username =>
                      setRequestData({
                        ...requestData,
                        auth: { ...requestData.auth, username },
                      })
                    }
                    placeholder="Username"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-3.5 w-3.5 text-indigo-500" />
                    <Label className="text-xs font-bold uppercase tracking-tight">Password</Label>
                  </div>
                  <VariableInputUnified
                    variant="overlay"
                    value={requestData.auth.password || ''}
                    onChange={password =>
                      setRequestData({
                        ...requestData,
                        auth: { ...requestData.auth, password },
                      })
                    }
                    placeholder="Password"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-500/80 font-bold leading-relaxed">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Credentials will be Base64 encoded and sent in the <code className="bg-indigo-500/10 px-1 rounded text-indigo-600">Authorization</code> header.
                </p>
              </div>
            </div>
          )}

          {requestData.auth.type === 'apikey' && (
            <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-3.5 w-3.5 text-indigo-500" />
                    <Label className="text-xs font-bold uppercase tracking-tight">API Key</Label>
                  </div>
                  <VariableInputUnified
                    variant="overlay"
                    value={requestData.auth.apiKey || ''}
                    onChange={apiKey =>
                      setRequestData({
                        ...requestData,
                        auth: { ...requestData.auth, apiKey },
                      })
                    }
                    placeholder="API Key"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                    <Label className="text-xs font-bold uppercase tracking-tight">Header Name</Label>
                  </div>
                  <VariableInputUnified
                    variant="overlay"
                    value={requestData.auth.apiKeyHeader || 'X-API-Key'}
                    onChange={apiKeyHeader =>
                      setRequestData({
                        ...requestData,
                        auth: { ...requestData.auth, apiKeyHeader },
                      })
                    }
                    placeholder="e.g. X-API-Key"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-500/80 font-bold leading-relaxed">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  The API Key will be sent in the custom header specified above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
