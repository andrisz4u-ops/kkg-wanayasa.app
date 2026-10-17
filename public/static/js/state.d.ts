export interface AppUser {
  id?: number;
  role?: string;
  nama?: string;
  sekolah_nama?: string;
  kelas?: string;
  [key: string]: unknown;
}

export interface AppState {
  user: AppUser | null;
  tenant: unknown;
  currentPage: string;
  currentAdminTab?: string;
  loading: boolean;
  mobileMenuOpen: boolean;
  pageParams: Record<string, string>;
  settings: Record<string, string>;
  unreadNotifications: number;
}

export declare const state: AppState;
