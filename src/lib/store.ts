/*
 * FROZEN CONTRACT (interface). Owned by the orchestrator session.
 * Codex-1 may extend the implementation with additional fields for UI state,
 * but must not rename or remove anything declared here, because Story Mode
 * and the AI client read through this exact interface.
 */
import { create } from "zustand";
import type { CaseMilestone, CaseModel } from "./caseModel";

export interface CaseState {
  caseModel: CaseModel | null;
  setCase: (c: CaseModel | null) => void;
  addMilestone: (m: CaseMilestone) => void;
  removeMilestone: (id: string) => void;
  setAiHeadline: (eventId: string, headline: string) => void;
  setAiCaseSummary: (summary: string) => void;
}

export const useCaseStore = create<CaseState>()((set) => ({
  caseModel: null,
  setCase: (c) => set({ caseModel: c }),
  addMilestone: (m) =>
    set((s) =>
      s.caseModel
        ? { caseModel: { ...s.caseModel, milestones: [...s.caseModel.milestones, m] } }
        : s
    ),
  removeMilestone: (id) =>
    set((s) =>
      s.caseModel
        ? {
            caseModel: {
              ...s.caseModel,
              milestones: s.caseModel.milestones.filter((m) => m.id !== id),
            },
          }
        : s
    ),
  setAiHeadline: (eventId, headline) =>
    set((s) =>
      s.caseModel
        ? {
            caseModel: {
              ...s.caseModel,
              events: s.caseModel.events.map((e) =>
                e.id === eventId ? { ...e, aiHeadline: headline } : e
              ),
            },
          }
        : s
    ),
  setAiCaseSummary: (summary) =>
    set((s) => (s.caseModel ? { caseModel: { ...s.caseModel, aiCaseSummary: summary } } : s)),
}));
