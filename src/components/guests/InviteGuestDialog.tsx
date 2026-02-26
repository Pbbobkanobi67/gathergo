"use client";

import { useState } from "react";
import { Copy, Check, UserPlus, Link2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddMember } from "@/hooks/useMembers";

interface InviteGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  inviteToken: string;
}

export function InviteGuestDialog({
  open,
  onOpenChange,
  tripId,
  inviteToken,
}: InviteGuestDialogProps) {
  const [tab, setTab] = useState<"link" | "manual">("link");
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const addMember = useAddMember();

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/join/${inviteToken}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMember = async () => {
    if (!name.trim() || !email.trim()) return;
    try {
      await addMember.mutateAsync({
        tripId,
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim() || undefined,
      });
      setName("");
      setEmail("");
      setPhone("");
      onOpenChange(false);
    } catch {
      // Error is available on addMember.error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-400" />
            Invite Guests
          </DialogTitle>
          <DialogDescription>
            Share an invite link or add guests manually.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
          <button
            onClick={() => setTab("link")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "link"
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link2 className="h-4 w-4" />
            Share Link
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "manual"
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="h-4 w-4" />
            Add Manually
          </button>
        </div>

        {/* Share Link Tab */}
        {tab === "link" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Anyone with this link can join the trip and RSVP.
              </p>
            </div>
          </div>
        )}

        {/* Manual Add Tab */}
        {tab === "manual" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name" required>Name</Label>
              <Input
                id="guest-name"
                placeholder="Guest name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-email" required>Email</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone (optional)</Label>
              <Input
                id="guest-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {addMember.isError && (
              <p className="text-sm text-red-400">
                {addMember.error.message}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                isLoading={addMember.isPending}
                disabled={!name.trim() || !email.trim()}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Guest
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
