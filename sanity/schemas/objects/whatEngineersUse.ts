import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/whatEngineersUse.ts

export default defineType({
  name: 'whatEngineersUse',
  title: 'What Engineers Actually Use This For',
  type: 'object',
  description: 'Connects theory to practice explicitly. The real-world scenario where you would reach for this concept, protocol, or technique.',
  fields: [
    defineField({
      name: 'scenario',
      title: 'Real-world scenario',
      type: 'text',
      rows: 4,
      description: 'Describe the exact situation. Be specific — "In an MSP environment when you inherit a network with no documentation and a BGP session flapping every 6 hours..." is far better than "When routing issues occur."',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'environment',
      title: 'Environment type',
      type: 'string',
      description: 'Where would this scenario play out?',
      options: {
        list: [
          { title: '🏢 MSP / Managed Services', value: 'msp' },
          { title: '🏛 Enterprise', value: 'enterprise' },
          { title: '☁️ Cloud / Hybrid', value: 'cloud' },
          { title: '🔬 Home Lab', value: 'home-lab' },
          { title: '🎓 Academic / Education', value: 'academic' },
          { title: '📡 Service Provider / ISP', value: 'isp' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'toolsInvolved',
      title: 'Tools / gear involved (optional)',
      type: 'string',
      description: 'e.g. "Cisco ASA, Wireshark, GNS3" — what would an engineer actually have open when dealing with this?',
    }),
  ],
  preview: {
    select: { title: 'scenario', subtitle: 'environment' },
    prepare({ title, subtitle }) {
      return { title: `🔧 ${title?.slice(0, 80)}`, subtitle }
    },
  },
})