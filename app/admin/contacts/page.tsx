import { redirect } from "next/navigation";

/** Legacy path — use /admin/quick-contacts */
export default function AdminContactsRedirectPage() {
  redirect("/admin/quick-contacts");
}
