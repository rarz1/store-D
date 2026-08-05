import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface FavoriteItem {
  garmentId: number;
  garmentName: string;
  garmentSlug: string;
  basePrice: number;
  colorHex: string;
  colorName: string;
  size: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  removeFavorite: (garmentId: number, colorHex: string, size: string) => void;
  isFavorite: (garmentId: number, colorHex: string, size: string) => boolean;
  totalCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem("favorites");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveFavorites(favorites: FavoriteItem[]) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">) => {
    setFavorites((prev) => {
      const exists = prev.find(
        (f) =>
          f.garmentId === item.garmentId &&
          f.colorHex === item.colorHex &&
          f.size === item.size
      );
      if (exists) return prev;
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFavorite = useCallback((garmentId: number, colorHex: string, size: string) => {
    setFavorites((prev) => prev.filter((f) => !(f.garmentId === garmentId && f.colorHex === colorHex && f.size === size)));
  }, []);

  const isFavorite = useCallback(
    (garmentId: number, colorHex: string, size: string) => {
      return favorites.some((f) => f.garmentId === garmentId && f.colorHex === colorHex && f.size === size);
    },
    [favorites]
  );

  const totalCount = favorites.length;

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, totalCount }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}