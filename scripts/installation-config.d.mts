export interface InstallationConfig {
    slug: string;
    projectName: string;
    databaseName: string;
    databaseId: string;
    bucketName: string;
    organization: Record<string, string>;
    admin: { nama: string; email: string };
    schools: Array<{ nama: string; npsn?: string; tipe: 'negeri' | 'swasta'; alamat: string; kepala_sekolah: string; nip_kepala_sekolah: string; is_sekretariat: boolean }>;
}
export function parseInstallation(input: unknown): InstallationConfig;
export function makeWranglerConfig(config: InstallationConfig): {
    name: string; compatibility_date: string; compatibility_flags: string[];
    pages_build_output_dir: string;
    d1_databases: Array<{ binding: string; database_name: string; database_id: string; migrations_dir: string }>;
    r2_buckets: Array<{ binding: string; bucket_name: string }>;
    ai: { binding: string }; vars: Record<string, string>;
};
export function makeBootstrapSql(config: InstallationConfig, password: string): string;
export declare const LEGACY_PRIMARY_ID: string;
export declare const LEGACY_SCHOOL_NAMES: string[];
