import { useState } from "react";
import { activitiesApi } from "@/api/activities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  onSuccess: () => void;
}

export function AddPhotoModal({ open, onOpenChange, activityId, onSuccess }: Props) {
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;
    setSubmitting(true);
    try {
      await activitiesApi.addPhoto(activityId, {
        file_url: fileUrl.trim(),
        caption: caption.trim() || undefined,
      });
      toast({ title: "Photo added" });
      setFileUrl("");
      setCaption("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed to add photo" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
          <DialogDescription>
            Add a photo to the activity gallery. Upload the image first via the file upload endpoint.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file_url">Image URL *</Label>
            <Input
              id="file_url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={255}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !fileUrl.trim()}>
              {submitting ? "Adding…" : "Add Photo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
