import type { DatabaseSync } from 'node:sqlite';

export interface AssessmentImageCapPreflightReport {
  tables: number;
  targetIndexes: number;
  incomingTargetForeignKeys: number;
}

/** Inspect only schema/dependency metadata in an exported SQLite snapshot. */
export function inspectAssessmentImageCapDependencies(
  db: DatabaseSync,
): AssessmentImageCapPreflightReport;
