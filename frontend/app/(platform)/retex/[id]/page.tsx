import { redirect } from "next/navigation";

/** RETEX retiré du MVP — redirection vers les projets. */
export default function RetexDetailRedirectPage() {
  redirect("/projects");
}
