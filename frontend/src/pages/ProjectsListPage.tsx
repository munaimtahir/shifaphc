import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects, Project } from "../api";
import { useAuth } from "../auth";

export default function ProjectsListPage() {
    const { canMutate } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        setLoading(true);
        try {
            const data = await fetchProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ margin: 0, marginRight: "auto" }}>Projects</h1>
                {canMutate && (
                    <Link
                        to="/projects/new"
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#059669",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: 8,
                            fontWeight: "bold",
                            fontSize: "14px",
                        }}
                    >
                        + New Project
                    </Link>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                    Loading projects...
                </div>
            ) : (
                <div
                    style={{
                        background: "white",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Name</th>
                                <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Status</th>
                                <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Updated</th>
                                <th style={{ padding: "16px 20px", color: "#4b5563", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "#111827" }}>
                                        <Link to={`/projects/${project.id}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 10px",
                                                borderRadius: 9999,
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                backgroundColor: project.status === "active" ? "#ecfdf5" : "#f3f4f6",
                                                color: project.status === "active" ? "#064e3b" : "#374151",
                                                border: `1px solid ${project.status === "active" ? "#d1fae5" : "#e5e7eb"}`,
                                            }}
                                        >
                                            {project.status === "active" ? "Active" : "Archived"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 20px", color: "#6b7280", fontSize: "0.9rem" }}>
                                        {new Date(project.updated_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <Link to={`/projects/${project.id}`} style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                                        No projects yet. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
