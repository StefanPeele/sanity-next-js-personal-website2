'use client'

import {apiVersion, dataset, projectId, studioUrl} from '@/sanity/lib/api'
import * as resolve from '@/sanity/plugins/resolve'
import {pageStructure, singletonPlugin} from '@/sanity/plugins/settings'
import { gardenToolPlugin } from '@/sanity/plugins/garden-tool'
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

// Digital Garden Schemas
import note from '@/sanity/schemas/documents/note'
import tag from '@/sanity/schemas/documents/tag'
import series from '@/sanity/schemas/documents/series'
import glossaryTerm from '@/sanity/schemas/documents/glossaryTerm'
import learningPath from '@/sanity/schemas/documents/learningPath'
import certification from '@/sanity/schemas/documents/certification'
import education from '@/sanity/schemas/documents/education'
import testimonial from '@/sanity/schemas/documents/testimonial'
import subscriber from '@/sanity/schemas/documents/subscriber'
import { siteSingletons, siteTypes } from '@/sanity/schemas/site'
import { articleUiSingletons, articleUiTypes } from '@/sanity/schemas/articleUi'
import { servicesSingletons, servicesTypes } from '@/sanity/schemas/services'

const allSingletons = [home, settings, ...siteSingletons, ...articleUiSingletons, ...servicesSingletons]

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
      note,
      tag,
      series,
      glossaryTerm,
      learningPath,
      certification,
      education,
      testimonial,
      subscriber,
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
      // Site copy, navigation, taxonomy, services (barrels)
      ...siteTypes,
      ...articleUiTypes,
      ...servicesTypes,
    ],
  },
  plugins: [
    structureTool({
      structure: pageStructure(allSingletons),
    }),
    presentationTool({
      resolve,
      previewUrl: { previewMode: { enable: '/api/draft-mode/enable' } },
    }),
    singletonPlugin(allSingletons.map((s) => s.name)),
    unsplashImageAsset(),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
    media(),
    gardenToolPlugin(),
  ],
})