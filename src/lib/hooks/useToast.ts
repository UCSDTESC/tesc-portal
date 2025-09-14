import toast from "react-hot-toast";

export default function DisplayToast(message: string, type: "error" | "success") {
  return type === "success"
    ? toast.success(message, { position: "top-right" })
    : toast.error(message, { position: "top-right" });
}
