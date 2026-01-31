// DeleteConfirmationModal.tsx
import * as React from "react";
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

      <AlertDialogContent className="max-w-xl p-0 overflow-hidden border-none bg-transparent">
        {/* Outer white card to match portal style */}
        <div className="w-full rounded-3xl bg-white shadow-xl ">
          {/* Header – matches DataTable navy */}
          <div className="rounded-t-3xl bg-[#114675] px-8 py-6 text-white">
            <h1 className="mt-2 text-2xl font-semibold flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20 border-2 border-red-600 ">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              Delete {itemName}?
            </h1>
            <p className="mt-1 text-sm text-white/90">
              This will permanently remove {itemName}. This action cannot be undone.
            </p>
          </div>

          {/* Body section – like the white info card */}
          <div className="px-8 py-6">
            <AlertDialogHeader className="p-0 mb-2">
              <AlertDialogTitle className="text-base font-semibold text-slate-900">
                What this will do
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-500">
                Before you continue, make sure you understand what happens when you delete this.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>Remove this item from the portal.</li>
              <li>Hide it from any members who could previously view it.</li>
              <li>You won&apos;t be able to recover it later.</li>
            </ul>

            <hr className="mt-5 mb-4 " />

            <AlertDialogFooter className="flex items-center justify-end gap-3 p-0">
              <AlertDialogCancel
                disabled={isDeleting}
                className=" text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleConfirm}
                className="bg-red-700 hover:bg-red-800 text-white disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeleting ? "Deleting…" : `Delete ${itemName}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
