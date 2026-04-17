import { redirect } from "next/navigation";

/** RETEX retiré du MVP — redirection vers les projets. */
export default function RetexRedirectPage() {
  redirect("/projects");
}
