"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCities,
  getAttractions,
  getAttractionById,
  getAttractionsByCity,
  type AttractionsQuery,
} from "@/lib/supabase/queries/attractions";

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAttractions(query: AttractionsQuery = {}) {
  return useQuery({
    queryKey: ["attractions", query],
    queryFn: () => getAttractions(query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttraction(id: string) {
  return useQuery({
    queryKey: ["attraction", id],
    queryFn: () => getAttractionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttractionsByCity(cityId: string) {
  return useQuery({
    queryKey: ["attractionsByCity", cityId],
    queryFn: () => getAttractionsByCity(cityId),
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
  });
}
