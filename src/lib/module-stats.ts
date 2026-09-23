import type { MaterialUpload, Module, Topic } from "@/types";

const NOTE_KINDS = new Set(["notes", "slides"]);

export function materialsForModule(
  materials: MaterialUpload[],
  moduleId: string,
) {
  return materials.filter(
    (m) => m.status === "published" && m.moduleId === moduleId,
  );
}

export function noteMaterials(materials: MaterialUpload[], moduleId: string) {
  return materialsForModule(materials, moduleId).filter((m) =>
    NOTE_KINDS.has(m.kind),
  );
}

export function pastPaperMaterials(
  materials: MaterialUpload[],
  moduleId: string,
) {
  return materialsForModule(materials, moduleId).filter(
    (m) => m.kind === "past_paper",
  );
}

export function enrichModule(
  module: Module,
  materials: MaterialUpload[],
  topics: Topic[],
): Module {
  const moduleTopics = topics.filter((t) => t.moduleId === module.id);
  // Only count real topic rows — never fall back to a stale mock total.
  const topicsTotal = moduleTopics.length;
  const topicsCompleted = moduleTopics.filter((t) => t.completed).length;
  const notes = noteMaterials(materials, module.id);
  const papers = pastPaperMaterials(materials, module.id);
  const liveNotes = notes.length;
  const livePapers = papers.length;
  const progress =
    topicsTotal > 0
      ? Math.round((topicsCompleted / topicsTotal) * 100)
      : module.progress;

  return {
    ...module,
    // Live uploads only — empty until Admin/CR publish for this module.
    notesCount: liveNotes,
    pastPapersCount: livePapers,
    topicsCompleted,
    topicsTotal,
    progress,
  };
}

export function enrichModules(
  modules: Module[],
  materials: MaterialUpload[],
  topics: Topic[],
): Module[] {
  return modules.map((m) => enrichModule(m, materials, topics));
}
