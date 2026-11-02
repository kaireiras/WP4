import type { ApRegistryRecord } from '#/services/apService'

// Form error type following Fe-Voting pattern
export type ApFormErrors = Partial<Record<string, Array<string>>> | null

// Re-export ApRegistryRecord as ApRecord
export type ApRecord = ApRegistryRecord
