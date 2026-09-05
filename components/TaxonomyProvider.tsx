'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_TAXONOMY, type TaxonomyData, type VocabEntry } from '@/lib/cms/defaults/taxonomy'
// components/TaxonomyProvider.tsx
// Makes Studio-edited labels (article lanes, note statuses, …) available to client components.

const TaxonomyContext = createContext<TaxonomyData>(DEFAULT_TAXONOMY)

export function TaxonomyProvider({ value, children }: { value: TaxonomyData; children: React.ReactNode }) {
  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>
}

export function useTaxonomy(): TaxonomyData {
  return useContext(TaxonomyContext)
}

export function useVocab(group: keyof TaxonomyData, key?: string | null): VocabEntry | null {
  const tax = useTaxonomy()
  if (!key) return null
  return tax[group].find((e) => e.key === key) ?? null
}
