import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    role: z.string(),
    timeline: z.string(),
    featured: z.boolean().default(false),
    techStack: z.array(z.string()),
    order: z.number().default(99),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
  }),
});

export const collections = { projects };
