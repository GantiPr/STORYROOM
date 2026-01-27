"use client";

import { createContext, useContext, ReactNode } from "react";
import { useProjects } from "@/hooks/useProjects";
import type { Project, StoryBible } from "@/lib/types";

type ProjectContextType = {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  isLoaded: boolean;
  setActiveProjectId: (id: string | null) => void;
  createProject: (name: string, description?: string) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  updateProjectBible: (projectId: string, bible: StoryBible) => void;
  deleteProject: (projectId: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const projectsData = useProjects();
  const activeProject = projectsData.getActiveProject();

  return (
    <ProjectContext.Provider value={{ ...projectsData, activeProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}
