import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_URL: z.string().url().default('http://localhost:8000'),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z
      .string()
      .min(1)
      .default('PLMD · Aplikasi Pendeteksi Keramaian'),
    VITE_ENV: z.enum(['development', 'production']).default('production'),
    VITE_REVERB_APP_KEY: z.string().min(1).default('pmld_app_key'),
    VITE_REVERB_HOST: z.string().default('localhost'),
    VITE_REVERB_PORT: z.coerce.number().default(9008),
    VITE_REVERB_SCHEME: z.enum(['http', 'https']).default('http'),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: {
    SERVER_URL:
      typeof process !== 'undefined'
        ? process.env.SERVER_URL
        : import.meta.env.SERVER_URL,
    VITE_APP_TITLE:
      (typeof process !== 'undefined'
        ? process.env.VITE_APP_TITLE
        : undefined) ?? import.meta.env.VITE_APP_TITLE,
    VITE_ENV:
      (typeof process !== 'undefined' ? process.env.VITE_ENV : undefined) ??
      import.meta.env.VITE_ENV,
    VITE_REVERB_APP_KEY:
      (typeof process !== 'undefined'
        ? process.env.VITE_REVERB_APP_KEY
        : undefined) ?? import.meta.env.VITE_REVERB_APP_KEY,
    VITE_REVERB_HOST:
      (typeof process !== 'undefined'
        ? process.env.VITE_REVERB_HOST
        : undefined) ?? import.meta.env.VITE_REVERB_HOST,
    VITE_REVERB_PORT:
      (typeof process !== 'undefined'
        ? process.env.VITE_REVERB_PORT
        : undefined) ?? import.meta.env.VITE_REVERB_PORT,
    VITE_REVERB_SCHEME:
      (typeof process !== 'undefined'
        ? process.env.VITE_REVERB_SCHEME
        : undefined) ?? import.meta.env.VITE_REVERB_SCHEME,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
