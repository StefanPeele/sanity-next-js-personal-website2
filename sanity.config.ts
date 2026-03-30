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
// IMPORT THE MEDIA PLUGIN
import { media } from 'sanity-plugin-media'
// IMPORT THE SKILL & CATEGORY SCHEMAS HERE
import skill from '@/sanity/schemas/objects/skill' 
import category from '@/sanity/schemas/documents/category' 

// <-- NEW: IMPORT THE CODE PLUGIN -->
import {codeInput} from '@sanity/code-input'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

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
      
      // Objects
      skill, 
      milestone,
      timeline,
    ],
  },
  plugins: [
    structureTool({
      structure: pageStructure([home, settings]),
    }),
    presentationTool({
      resolve,
      previewUrl: {previewMode: {enable: '/api/draft-mode/enable'}},
    }),
    singletonPlugin([home.name, settings.name]),
    unsplashImageAsset(),
    visionTool({defaultApiVersion: apiVersion}),
    
    // <-- NEW: ADD THE CODE PLUGIN TO THE ARRAY -->
    codeInput(),
    
    // <-- NEW: ADD THE MEDIA PLUGIN HERE -->
    media(),
  ],
})