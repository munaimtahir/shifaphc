import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, fetchProjects, DashboardStats, Project } from "../api";
import { useAuth } from "../auth";

export default function Dashboard() {
    const { canMutate } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [statsData, projectsData] = await Promise.all([
                    fetchDashboardStats(),
                    fetchProjects(),
                ]);
                setStats(statsData);
                setProjects(projectsData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Dashboard</h1>
                    <div style={{ color: "#6b7280", marginTop: 6 }}>
                        Project-driven compliance management.
                    </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <Link
                        to={canMutate ? "/projects/new" : "#"}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: canMutate ? "#2563eb" : "#e5e7eb",
                            color: canMutate ? "#fff" : "#9ca3af",
                            textDecoration: "none",
                            borderRadius: 8,
                            fontWeight: "bold",
                            cursor: canMutate ? "pointer" : "not-allowed",
                            pointerEvents: canMutate ? "auto" : "none",
                        }}
                    >
                        Create Project
                    </Link>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                    Loading dashboard...
                </div>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                        <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Projects</div>
                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats?.projects ?? 0}</div>
                            <Link to="/projects" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>View projects</Link>
                        </div>
                        <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Indicators</div>
                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats?.indicators ?? 0}</div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Across all projects</div>
                        </div>
                        <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Compliance Records</div>
                            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats?.compliance_records ?? 0}</div>
                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Latest evidence history</div>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Projects</h2>
                            <Link to="/projects" style={{ marginLeft: "auto", color: "#2563eb", textDecoration: "none", fontSize: "0.85rem" }}>
                                View all
                            </Link>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                    <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Name</th>
                                    <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.slice(0, 5).map((project) => (
                                    <tr key={project.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                                            <Link to={`/projects/${project.id}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                                                {project.name}
                                            </Link>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
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
                                        <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                                            {new Date(project.updated_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                                            No projects yet. Create a project to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
