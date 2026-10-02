import { notFound } from "next/navigation";

import { EntitiesScreen } from "@/feature/entities";
import { ProjectDetail } from "@/feature/projects";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const projectId = Number((await params).id);

  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  return (
    <ProjectDetail projectId={projectId}>
      <EntitiesScreen projectId={projectId} />
    </ProjectDetail>
  );
}
