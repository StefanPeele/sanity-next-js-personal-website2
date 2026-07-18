'use client'

import {apiVersion, dataset, projectId, studioUrl} from '@/sanity/lib/api'
import * as resolve from '@/sanity/plugins/resolve'
import {pageStructure, singletonPlugin} from '@/sanity/plugins/settings'
import page from '@/sanity/schemas/documents/page'
import project from '@/sanity/schemas/documents/project'
import duration from '@/sanity/schemas/objects/duration'
import milestone from '@/sanity/schemas/objects/milestone'
import timeline from '@/sanity/schemas/objects/timeline'
import home from '@/sanity/schemas/singletons/home'
import gallery from '@/sanity/schemas/documents/gallery'
import post from '@/sanity/schemas/documents/post'
import experience from '@/sanity/schemas/documents/experience'
import settings from '@/sanity/schemas/singletons/settings'
import { media } from 'sanity-plugin-media'
import skill from '@/sanity/schemas/objects/skill'
import category from '@/sanity/schemas/documents/category'
import { codeInput } from '@sanity/code-input'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
// sanity.config.ts

// Interactive Blog Feature Schemas
import knowledgeQuiz from '@/sanity/schemas/objects/knowledgeQuiz'
import layerExplorer from '@/sanity/schemas/objects/layerExplorer'
import packetAnimator from '@/sanity/schemas/objects/packetAnimator'
import wiresharkCallout from '@/sanity/schemas/objects/wiresharkCallout'

// Editorial Feature Schemas (existing)
import sectionBreak from '@/sanity/schemas/objects/sectionBreak'
import failureNote from '@/sanity/schemas/objects/failureNote'

// New Learning Block Schemas
import whatIGotWrong from '@/sanity/schemas/objects/whatIGotWrong'
import whatEngineersUse from '@/sanity/schemas/objects/whatEngineersUse'
import theProblemSolved from '@/sanity/schemas/objects/theProblemSolved'
import conceptStressTest from '@/sanity/schemas/objects/conceptStressTest'

// Library Schema
import mediaItem from '@/sanity/schemas/documents/mediaItem'

const title =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_TITLE || 'Stefan Peele II | Digital Archive'

export default defineConfig({
  basePath: studioUrl,
  projectId: projectId || '',
  dataset: dataset || '',
  title,
  schema: {
    types: [
      // Singletons
      home,
      settings,
      // Documents
      duration,
      page,
      project,
      gallery,
      experience,
      post,
      category,
      mediaItem,
      // Objects
      skill,
      milestone,
      timeline,
      // Interactive Blog Features
      knowledgeQuiz,
      layerExplorer,
      packetAnimator,
      wiresharkCallout,
      // Editorial Features
      sectionBreak,
      failureNote,
      // New Learning Blocks
      whatIGotWrong,
      whatEngineersUse,
      theProblemSolved,
      conceptStressTest,
    ],
  },
  plugins: [
    structureTool({
      structure: pageStructure([home, settings]),
    }),
    presentationTool({
      resolve,
      previewUrl: { previewMode: { enable: '/api/draft-mode/enable' } },
    }),
    singletonPlugin([home.name, settings.name]),
    unsplashImageAsset(),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
    media(),
  ],
})