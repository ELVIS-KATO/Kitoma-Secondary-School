import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '@/api/client';

interface SchoolInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
}

interface SettingsState {
  schoolInfo: SchoolInfo;
  isLoading: boolean;
  setSchoolInfo: (info: SchoolInfo) => void;
  fetchSettings: () => Promise<void>;
  updateSchoolInfo: (info: SchoolInfo) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      schoolInfo: {
        name: 'Kitoma Secondary School',
        email: 'admin@kitoma.ac.ug',
        phone: '+256 700 000000',
        address: 'P.O. Box 123, Kitoma',
        logo_url: null,
      },
      isLoading: false,

      setSchoolInfo: (info) => set({ schoolInfo: info }),

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const response = await client.get<SchoolInfo>('/settings/school');
          set({ schoolInfo: response.data, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch settings:', error);
          set({ isLoading: false });
        }
      },

      updateSchoolInfo: async (info) => {
        set({ isLoading: true });
        try {
          await client.post('/settings/school', info);
          set({ schoolInfo: info, isLoading: false });
        } catch (error) {
          console.error('Failed to update school info:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
