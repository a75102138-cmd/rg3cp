import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale/fr";

export function formatDate(iso: string, pattern = "d MMM yyyy") {
  try {
    const d = iso.includes("T") ? parseISO(iso) : parseISO(`${iso}T12:00:00`);
    return format(d, pattern, { locale: fr });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy HH:mm", { locale: fr });
  } catch {
    return iso;
  }
}
