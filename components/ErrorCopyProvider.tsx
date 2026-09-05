'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_ERROR_PAGES, type ErrorPagesCopy } from '@/lib/cms/defaults/errorPages'
// components/ErrorCopyProvider.tsx
// error.tsx is a client component and cannot fetch; the root layout provides the copy.

const ErrorCopyContext = createContext<ErrorPagesCopy['error']>(DEFAULT_ERROR_PAGES.error)

export function ErrorCopyProvider({ value, children }: { value: ErrorPagesCopy['error']; children: React.ReactNode }) {
  return <ErrorCopyContext.Provider value={value}>{children}</ErrorCopyContext.Provider>
}

export function useErrorCopy() {
  return useContext(ErrorCopyContext)
}
