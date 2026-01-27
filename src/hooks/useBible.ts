"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoryBible } from "@/lib/types";
import { defaultBible } from "@/lib/defaultBible";

const STORAGE_KEY = "storyroom-bible";
const SESSION_ID_KEY = "storyroom-session-id";

export function useBible() {
  const [bible, setBible] = useState<StoryBible>(defaultBible);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load bible from database on mount
  useEffect(() => {
    loadLatestSession();
  }, []);

  const loadLatestSession = async () => {
    try {
      const response = await fetch('/api/sessions?action=latest');
      const data = await response.json();

      if (data.session) {
        setBible(data.session);
        setSessionId(data.sessionId);
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      } else {
        // No session in database, try localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedSessionId = localStorage.getItem(SESSION_ID_KEY);
        
        if (saved) {
          const parsedBible = JSON.parse(saved);
          setBible(parsedBible);
          setSessionId(savedSessionId);
        }
      }
    } catch (error) {
      console.warn("Failed to load session from database, using localStorage:", error);
      
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedSessionId = localStorage.getItem(SESSION_ID_KEY);
        
        if (saved) {
          const parsedBible = JSON.parse(saved);
          setBible(parsedBible);
          setSessionId(savedSessionId);
        }
      } catch (localError) {
        console.warn("Failed to load from localStorage:", localError);
      }
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSession = useCallback(async (bibleToSave: StoryBible) => {
    if (!isLoaded) return; // Don't save during initial load
    
    setIsSaving(true);
    try {
      // Save to localStorage immediately for responsiveness
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bibleToSave));
      
      // Save to database
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bible: bibleToSave, sessionId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      } else {
        console.warn("Failed to save to database:", data.error);
      }
    } catch (error) {
      console.warn("Failed to save session:", error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, isLoaded]);

  // Auto-save whenever bible changes (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeoutId = setTimeout(() => {
      saveSession(bible);
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [bible, saveSession, isLoaded]);

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
    loadLatestSession
  };
}