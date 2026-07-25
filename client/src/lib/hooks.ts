import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { GarmentRow, GarmentColorRow, GarmentSizeRow, EstampadoRow, EstampadoSizeRow, EstampadoLocationRow } from "./supabase";

export function useGarment(slug: string) {
  return useQuery({
    queryKey: ["garment", slug],
    queryFn: async () => {
      const { data } = await supabase.from("garments").select("*").eq("slug", slug).single();
      return data as GarmentRow | null;
    },
    enabled: !!slug,
  });
}

export function useGarmentColors(garmentId: number) {
  return useQuery({
    queryKey: ["garment-colors", garmentId],
    queryFn: async () => {
      const { data } = await supabase.from("garment_colors").select("*").eq("garment_id", garmentId).order("id");
      return (data ?? []) as GarmentColorRow[];
    },
    enabled: garmentId > 0,
  });
}

export function useGarmentSizes(garmentId: number) {
  return useQuery({
    queryKey: ["garment-sizes", garmentId],
    queryFn: async () => {
      const { data } = await supabase.from("garment_sizes").select("*").eq("garment_id", garmentId).order("id");
      return (data ?? []) as GarmentSizeRow[];
    },
    enabled: garmentId > 0,
  });
}

export function useEstampados() {
  return useQuery({
    queryKey: ["estampados"],
    queryFn: async () => {
      const { data } = await supabase.from("estampados").select("*").eq("active", true).order("sort_order");
      return (data ?? []) as EstampadoRow[];
    },
  });
}

export function useEstampadoSizes() {
  return useQuery({
    queryKey: ["estampado-sizes"],
    queryFn: async () => {
      const { data } = await supabase.from("estampado_sizes").select("*").order("sort_order");
      return (data ?? []) as EstampadoSizeRow[];
    },
  });
}

export function useEstampadoLocations() {
  return useQuery({
    queryKey: ["estampado-locations"],
    queryFn: async () => {
      const { data } = await supabase.from("estampado_locations").select("*").order("sort_order");
      return (data ?? []) as EstampadoLocationRow[];
    },
  });
}
