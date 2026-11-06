import { X } from "lucide-react";
import type { ActivityPhoto } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  photos: ActivityPhoto[];
  onRemove?: (photoId: string) => void;
}

export function PhotoGallery({ photos, onRemove }: Props) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No photos yet. Add some memories from this activity!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative rounded-md overflow-hidden border">
          <img
            src={photo.file_url}
            alt={photo.caption ?? "Activity photo"}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          {photo.caption && (
            <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
              {photo.caption}
            </p>
          )}
          {onRemove && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(photo.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
