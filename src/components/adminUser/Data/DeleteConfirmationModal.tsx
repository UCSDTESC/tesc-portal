// DeleteConfirmationModal.tsx
import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@components/components/ui/alert-dialog";

type DeleteConfirmationModalProps = {
  itemName?: string; // "this event", "your profile", etc.
  isDeleting?: boolean;
  onConfirm: () => Promise<void> | void;
  trigger: React.ReactNode; // the button/icon that opens the modal
};

export function DeleteConfirmationModal({
  itemName = "this item",
  isDeleting = false,
  onConfirm,
  trigger,
}: DeleteConfirmationModalProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent className="card-shadow max-w-lg rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Delete {itemName}?
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">
              This will permanently remove {itemName}. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <AlertDialogHeader className="p-0">
            <AlertDialogTitle className="text-sm font-semibold text-ink">
              What this will do
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-ink-secondary">
              Before you continue, make sure you understand what happens when you delete this.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ink-secondary">
            <li>Remove this item from the portal.</li>
            <li>Hide it from any members who could previously view it.</li>
            <li>You won&apos;t be able to recover it later.</li>
          </ul>
        </div>

        <AlertDialogFooter className="mt-6 flex items-center justify-end gap-2 p-0">
          <AlertDialogCancel
            disabled={isDeleting}
            className="cursor-pointer rounded-xl border-line text-ink hover:bg-surface"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={handleConfirm}
            className="cursor-pointer rounded-xl bg-destructive text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting…" : `Delete ${itemName}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
