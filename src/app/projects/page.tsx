"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const { projects, isLoaded, createProject, deleteProject } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading projects...</div>
      </div>
    );
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    createProject(newProjectName.trim(), newProjectDescription.trim());
    setNewProjectName("");
    setNewProjectDescription("");
    setShowCreateModal(false);
    
    // Navigate to the dashboard
    router.push(`/dashboard`);
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-7xl font-bold mb-4 tracking-tight">
            <span className="inline-block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              storyroom
            </span>
          </h1>
          <p className="text-xl text-zinc-400">Your creative writing workspace</p>
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Your Projects</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all hover:scale-105 shadow-lg"
            >
              + New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-5xl">📝</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Projects Yet</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Create your first story project to start building characters, conducting research, and developing your narrative.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium text-lg transition-all hover:scale-105"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard`)}
                  className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700 p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-zinc-400 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="ml-2 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-400">{project.bible.characters.length}</div>
                      <div className="text-xs text-zinc-500">Characters</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{project.bible.research.length}</div>
                      <div className="text-xs text-zinc-500">Research</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">{project.bible.builderSessions?.length || 0}</div>
                      <div className="text-xs text-zinc-500">Sessions</div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 max-w-md w-full">
              <h2 className="text-2xl font-semibold text-white mb-6">Create New Project</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., The Last Guardian"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Brief description of your story..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName("");
                    setNewProjectDescription("");
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
