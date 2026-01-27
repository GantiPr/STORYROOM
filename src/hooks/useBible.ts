"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoryBible } from "@/lib/types";
import { defaultBible } from "@/lib/defaultBible";

const STORAGE_KEY = "storyroom-bible";
const SESSION_ID_KEY = "storyroom-session-id";
const ACTIVE_PROJECT_KEY = "storyroom-active-project";

export function useBible() {
  const [bible, setBibleState] = useState<StoryBible>(defaultBible);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load bible from localStorage (project-specific)
  useEffect(() => {
    loadBibleFromStorage();
  }, []);

  const loadBibleFromStorage = () => {
    try {
      const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      
      if (activeProjectId) {
        // Load from projects
        const projectsData = localStorage.getItem("storyroom-projects");
        if (projectsData) {
          const projects = JSON.parse(projectsData);
          const activeProject = projects.find((p: any) => p.id === activeProjectId);
          
          if (activeProject) {
            const bibleWithDefaults = {
              ...activeProject.bible,
              builderSessions: activeProject.bible.builderSessions || []
            };
            setBibleState(bibleWithDefaults);
            setIsLoaded(true);
            return;
          }
        }
      }
      
      // Fallback to old storage method
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedSessionId = localStorage.getItem(SESSION_ID_KEY);
      
      if (saved) {
        const parsedBible = JSON.parse(saved);
        const bibleWithDefaults = {
          ...parsedBible,
          builderSessions: parsedBible.builderSessions || []
        };
        setBibleState(bibleWithDefaults);
        setSessionId(savedSessionId);
      }
    } catch (error) {
      console.error("Failed to load bible:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setBible = useCallback((updater: StoryBible | ((prev: StoryBible) => StoryBible)) => {
    setBibleState(prev => {
      const newBible = typeof updater === 'function' ? updater(prev) : updater;
      
      // Save to project storage
      try {
        const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
        
        if (activeProjectId) {
          const projectsData = localStorage.getItem("storyroom-projects");
          if (projectsData) {
            const projects = JSON.parse(projectsData);
            const updatedProjects = projects.map((p: any) => 
              p.id === activeProjectId 
                ? { ...p, bible: newBible, updatedAt: new Date().toISOString() }
                : p
            );
            localStorage.setItem("storyroom-projects", JSON.stringify(updatedProjects));
          }
        }
        
        // Also save to old storage for backward compatibility
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBible));
      } catch (error) {
        console.error("Failed to save bible:", error);
      }
      
      return newBible;
    });
  }, []);

  const saveSession = useCallback(async (bibleToSave: StoryBible) => {
    if (!isLoaded) return;
    
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bibleToSave));
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bible: bibleToSave, sessionId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      }
    } catch (error) {
      console.warn("Failed to save session:", error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, isLoaded]);

  const manualSave = useCallback(() => {
    saveSession(bible);
  }, [bible, saveSession]);

  return {
    bible,
    setBible,
    isLoaded,
    isSaving,
    sessionId,
    manualSave,
    loadBibleFromStorage
  };
}