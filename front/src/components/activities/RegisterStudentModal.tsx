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
  fee: number;
  onSuccess: () => void;
}

export function RegisterStudentModal({ open, onOpenChange, activityId, fee, onSuccess }: Props) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await activitiesApi.register(activityId, {
        student_id: studentId || undefined,
        mark_paid: markPaid,
      });
      toast({ title: "Student registered successfully" });
      setStudentId("");
      setMarkPaid(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Student</DialogTitle>
          <DialogDescription>
            Register a student for this activity.
            {fee > 0 && ` Fee: ${fee.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID (optional for self-registration)</Label>
            <Input
              id="student_id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Leave empty to register yourself"
            />
          </div>
          {fee > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mark_paid"
                checked={markPaid}
                onChange={(e) => setMarkPaid(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="mark_paid" className="font-normal cursor-pointer">
                Mark fee as paid now
              </Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registering…" : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}