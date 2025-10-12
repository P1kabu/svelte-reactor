/**
 * Run migrations on persisted data
 */
export function runMigrations<T>(
  data: any,
  currentVersion: number,
  targetVersion: number,
  migrations: Record<number, (data: any) => any>
): T {
  let migrated = data;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    const migrate = migrations[v];
    if (migrate) {
      migrated = migrate(migrated);
    }
  }

  return migrated;
}
