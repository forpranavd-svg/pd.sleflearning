import { redirect } from "next/navigation";

// #15 reuses the existing Browse Questions page (role filter + "Add to my
// list" are built into it) rather than duplicating it — this route just
// gives the hub card somewhere to link to.
export default function BuildBrowsePage() {
  redirect("/questions");
}
