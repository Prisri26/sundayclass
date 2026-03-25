import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  SelectedChurchPreview,
  clearSelectedChurch as clearSelectedChurchStorage,
  formatChurchCode,
  getChurchPreviewByCode,
  loadSelectedChurch,
  saveSelectedChurch,
} from '../lib/churchSelection';

type ChurchSelectionContextValue = {
  selectedChurch: SelectedChurchPreview | null;
  loading: boolean;
  selecting: boolean;
  selectChurchByCode: (code: string) => Promise<SelectedChurchPreview | null>;
  clearSelection: () => Promise<void>;
};

const ChurchSelectionContext = createContext<ChurchSelectionContextValue>({
  selectedChurch: null,
  loading: true,
  selecting: false,
  selectChurchByCode: async () => null,
  clearSelection: async () => undefined,
});

export function ChurchSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedChurch, setSelectedChurch] = useState<SelectedChurchPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSelectedChurch()
      .then((preview) => {
        if (mounted) {
          setSelectedChurch(preview);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<ChurchSelectionContextValue>(
    () => ({
      selectedChurch,
      loading,
      selecting,
      selectChurchByCode: async (input) => {
        const churchCode = formatChurchCode(input);
        if (churchCode.length !== 6) {
          return null;
        }

        setSelecting(true);
        try {
          const preview = await getChurchPreviewByCode(churchCode);
          if (!preview) {
            return null;
          }
          await saveSelectedChurch(preview);
          setSelectedChurch(preview);
          return preview;
        } finally {
          setSelecting(false);
        }
      },
      clearSelection: async () => {
        await clearSelectedChurchStorage();
        setSelectedChurch(null);
      },
    }),
    [loading, selecting, selectedChurch],
  );

  return <ChurchSelectionContext.Provider value={value}>{children}</ChurchSelectionContext.Provider>;
}

export function useChurchSelection() {
  return useContext(ChurchSelectionContext);
}
