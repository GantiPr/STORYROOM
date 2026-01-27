"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, StoryBible } from "@/lib/types";
import { defaultBible } from "@/lib/defaultBible";

const PROJECTS_KEY = "storyroom-projects";
const ACTIVE_PROJECT_KEY = "storyroom-active-project";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(PROJECTS_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
      }

      if (savedActiveId) {
        setActiveProjectId(savedActiveId);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects:", error);
    }
  }, [projects, isLoaded]);

  // Save active project ID
  useEffect(() => {
    if (!isLoaded) return;
    
    if (activeProjectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  }, [activeProjectId, isLoaded]);

  const createProject = useCallback((name: string, description: string = "") => {
    const newProject: Project = {
      id: `P${Date.now()}`,
      name,
      description,
      bible: { ...defaultBible, title: name },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    return newProject;
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const updateProjectBible = useCallback((projectId: string, bible: StoryBible) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, bible, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  }, [activeProjectId]);

  const getActiveProject = useCallback(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    isLoaded,
    createProject,
    updateProject,
    updateProjectBible,
    deleteProject,
    getActiveProject,
  };
}
