import { z } from 'zod';
import { mediaUrl, plainText, safeUrl } from '../utils/validation.js';
import { buttonSchema } from '../sections/index.js';

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour, e.g. #2563eb');

export const SOCIAL_PLATFORMS = ['github', 'linkedin', 'x', 'twitter', 'youtube', 'instagram', 'facebook', 'dribbble', 'medium', 'devto', 'stackoverflow', 'website', 'email'];

export const settingsSchema = z.object({
  siteTitle: plainText(120).min(1, 'Site title is required').default('Developer Portfolio'),
  tagline: plainText(200).default(''),
  logo: z
    .object({
      type: z.enum(['text', 'image']).default('text'),
      text: plainText(40).default('DN'),
      image: mediaUrl.default(''),
      alt: plainText(150).default(''),
    })
    .default({}),
  favicon: mediaUrl.default(''),
  theme: z
    .object({
      mode: z.enum(['dark', 'light']).default('dark'),
      allowToggle: z.boolean().default(true),
      primary: hex.default('#38bdf8'),
      secondary: hex.default('#818cf8'),
      accent: hex.default('#34d399'),
      background: hex.default('#0b1120'),
      fontPreset: z.enum(['modern', 'technical', 'classic', 'system']).default('modern'),
      buttonStyle: z.enum(['solid', 'soft', 'pill']).default('solid'),
      radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('lg'),
      headerLayout: z.enum(['left', 'center', 'split']).default('split'),
      footerLayout: z.enum(['simple', 'columns']).default('columns'),
    })
    .default({}),
  contact: z
    .object({
      email: z.union([z.literal(''), z.string().trim().email().max(254)]).default(''),
      phone: plainText(40).default(''),
      location: plainText(120).default(''),
    })
    .default({}),
  social: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORMS),
        url: safeUrl.refine((v) => v !== '', 'URL is required'),
        label: plainText(60).default(''),
      }),
    )
    .max(20)
    .default([]),
  header: z
    .object({
      sticky: z.boolean().default(true),
      showContactButton: z.boolean().default(true),
      contactButton: buttonSchema.removeDefault().default({ label: 'Contact', url: '/contact', style: 'primary' }),
    })
    .default({}),
  footer: z
    .object({
      intro: plainText(400).default(''),
      copyright: plainText(200).default('© {year} All rights reserved.'),
      showSocial: z.boolean().default(true),
      showContact: z.boolean().default(true),
      showNavigation: z.boolean().default(true),
    })
    .default({}),
  seo: z
    .object({
      titleTemplate: plainText(120)
        .refine((v) => v.includes('%s'), 'Template must contain %s')
        .default('%s | Developer Portfolio'),
      defaultDescription: plainText(320).default(''),
      ogImage: mediaUrl.default(''),
      twitterHandle: plainText(40).default(''),
      allowIndexing: z.boolean().default(true),
    })
    .default({}),
  resume: z
    .object({
      url: safeUrl.default(''),
      label: plainText(60).default('Download Résumé'),
    })
    .default({}),
});

export const defaultSettings = () => settingsSchema.parse({});
