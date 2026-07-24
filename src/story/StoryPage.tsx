/*
 * OWNER: Codex-2 (story mode session). See handoffs/CODEX2_STORY_MODE.md.
 * This stub exists so the scaffold builds. Replace it.
 */
import { Link } from "react-router-dom";
import { useCaseStore } from "../lib/store";

export default function StoryPage() {
  const caseModel = useCaseStore((s) => s.caseModel);

  if (!caseModel) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-ink-soft">No case loaded yet.</p>
        <Link to="/" className="underline">
          Load a case first
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-ink-soft">
        Story Mode placeholder for {caseModel.name}. Codex-2 builds here.
      </p>
    </main>
  );
}
