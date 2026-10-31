import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

const BUCKET = "body-photos";

export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number | null;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
}

/** Shrink a photo to max 1600px JPEG before upload; falls back to the original file. */
const resizeImage = async (file: File, maxSize = 1600): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
};

export const useBodyMeasurements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ["body-measurements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.map((m) => ({ ...m, weight: m.weight === null ? null : Number(m.weight) })) as BodyMeasurement[];
    },
    enabled: !!user?.id,
  });

  // Signed URLs for the private photos (valid 1 hour)
  const photoPaths = measurements.map((m) => m.photo_path).filter((p): p is string => !!p);
  const { data: photoUrls = {} } = useQuery({
    queryKey: ["body-photo-urls", photoPaths],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(photoPaths, 3600);
      if (error) throw error;
      return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) as Record<string, string>;
    },
    enabled: photoPaths.length > 0,
    staleTime: 50 * 60 * 1000,
  });

  const addMeasurement = useMutation({
    mutationFn: async ({ date, weight, photo, notes }: { date: Date; weight: number | null; photo?: File | null; notes?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      let photo_path: string | null = null;
      if (photo) {
        const blob = await resizeImage(photo);
        photo_path = `${user.id}/${format(date, "yyyy-MM-dd")}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(photo_path, blob, { contentType: blob.type || "image/jpeg" });
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase.from("body_measurements").insert({
        user_id: user.id,
        date: format(date, "yyyy-MM-dd"),
        weight,
        photo_path,
        notes: notes || null,
      });
      if (error) {
        if (photo_path) await supabase.storage.from(BUCKET).remove([photo_path]);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] });
      toast({ title: "Sparad", description: "Mätningen sparades" });
    },
    onError: () => toast({ title: "Fel", description: "Kunde inte spara mätningen", variant: "destructive" }),
  });

  const deleteMeasurement = useMutation({
    mutationFn: async (m: BodyMeasurement) => {
      if (m.photo_path) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([m.photo_path]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("body_measurements").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-measurements"] }),
    onError: () => toast({ title: "Fel", description: "Kunde inte ta bort mätningen", variant: "destructive" }),
  });

  return {
    measurements,
    isLoading,
    photoUrls,
    addMeasurement: addMeasurement.mutate,
    isAdding: addMeasurement.isPending,
    deleteMeasurement: deleteMeasurement.mutate,
  };
};
