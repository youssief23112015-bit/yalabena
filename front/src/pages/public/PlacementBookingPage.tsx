import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarClock, MapPin, Users } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatToast } from "@/hooks/useChatToast";
import {
  bookPublicPlacementTest,
  fetchPublicBranches,
  fetchPublicTestSlots,
} from "@/api/public";

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  level_interest: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PlacementBookingPage() {
  const { t } = useTranslation();
  const { pushToast } = useChatToast();
  const [branchId, setBranchId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: branches } = useQuery({
    queryKey: ["public-branches"],
    queryFn: fetchPublicBranches,
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["public-placement-slots", branchId],
    queryFn: () => fetchPublicTestSlots(branchId || undefined),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const bookingMutation = useMutation({
    mutationFn: (input: {
      slot_id: string;
      first_name: string;
      last_name: string;
      phone: string;
      email?: string;
      level_interest?: string;
    }) => bookPublicPlacementTest(input),
    onSuccess: () => {
      pushToast({
        kind: "info",
        message: t("public.placementBook.success", "Booking confirmed! We will contact you shortly."),
      });
      reset();
      setSelectedSlotId(null);
    },
    onError: () => {
      pushToast({
        kind: "error",
        message: t("public.placementBook.error", "Booking failed. Please try again."),
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!selectedSlotId) return;
    bookingMutation.mutate({
      slot_id: selectedSlotId,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email || undefined,
      level_interest: data.level_interest || undefined,
    });
  };

  const selectedSlot = (slots ?? []).find((s) => s.id === selectedSlotId);

  return (
    <PublicLayout>
      <title>{t("public.seo.placementTitle", "Book a Placement Test — Speak Up Academy")}</title>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">
            {t("public.placementBook.title", "Book a Placement Test")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("public.placementBook.subtitle", "Find a slot at your preferred branch and reserve your free placement test.")}
          </p>
        </div>
        <div className="mb-6 flex justify-center">
          <Select value={branchId || "all"} onValueChange={(v) => setBranchId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder={t("public.placementBook.allBranches", "All Branches")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("public.placementBook.allBranches", "All Branches")}
              </SelectItem>
              {(branches ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (slots ?? []).length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {t("public.placementBook.noSlots", "No available slots right now. Please check back soon.")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(slots ?? []).map((slot) => (
              <Card
                key={slot.id}
                className={selectedSlotId === slot.id ? "border-primary ring-2 ring-primary/30" : ""}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2 font-semibold">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        {new Date(slot.start_time).toLocaleString()} –{" "}
                        {new Date(slot.end_time).toLocaleTimeString()}
                      </p>
                      {slot.branch && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {slot.branch.name}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {slot.booked_count} / {slot.capacity}
                      </p>
                    </div>
                    <Badge variant="secondary">{slot.status}</Badge>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    disabled={slot.booked_count >= slot.capacity || slot.status !== "open"}
                    onClick={() => setSelectedSlotId(slot.id)}
                  >
                    {slot.booked_count >= slot.capacity || slot.status !== "open"
                      ? t("public.placementBook.unavailable", "Unavailable")
                      : t("public.placementBook.select", "Select Slot")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {selectedSlot && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="mb-1 text-lg font-semibold">
                {t("public.placementBook.formTitle", "Your Details")}
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {new Date(selectedSlot.start_time).toLocaleString()}
                {selectedSlot.branch ? ` — ${selectedSlot.branch.name}` : ""}
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      placeholder={t("public.leadForm.firstName", "First Name")}
                      {...register("first_name")}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder={t("public.leadForm.lastName", "Last Name")}
                      {...register("last_name")}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      placeholder={t("public.leadForm.phone", "Phone Number")}
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={t("public.leadForm.email", "Email (Optional)")}
                      {...register("email")}
                    />
                  </div>
                </div>
                <Select onValueChange={(val) => setValue("level_interest", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("public.leadForm.level", "Target Level")} />
                  </SelectTrigger>
                  <SelectContent>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting || bookingMutation.isPending}>
                    {bookingMutation.isPending
                      ? t("public.placementBook.booking", "Booking...")
                      : t("public.placementBook.confirm", "Confirm Booking")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedSlotId(null)}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}