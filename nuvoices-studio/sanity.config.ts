import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID

if (!projectId) {
  throw new Error('Missing Sanity Studio project ID')
}

export default defineConfig([
  {
    name: 'production',
    title: 'nuvoices (Production)',
    projectId,
    dataset: 'production',
    basePath: '/production',
    plugins: [structureTool(), visionTool()],
    schema: {types: schemaTypes},
  },
  {
    name: 'staging',
    title: 'nuvoices (Staging)',
    projectId,
    dataset: 'staging2',
    basePath: '/staging',
    plugins: [structureTool(), visionTool()],
    schema: {types: schemaTypes},
  },
])
