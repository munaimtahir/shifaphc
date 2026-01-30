import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProject, fetchIndicators, Indicator, Project } from "../api";
import { useAuth } from "../auth";

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { canMutate } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [loadingProject, setLoadingProject] = useState(true);
    const [loadingIndicators, setLoadingIndicators] = useState(true);

    useEffect(() => {
        if (!id) return;
        loadProject(id);
        loadIndicators(id);
    }, [id]);

    async function loadProject(projectId: string) {
        setLoadingProject(true);
        try {
            const data = await fetchProject(projectId);
            setProject(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProject(false);
        }
    }

    async function loadIndicators(projectId: string) {
        setLoadingIndicators(true);
        try {
            const data = await fetchIndicators(undefined, undefined, projectId);
            setIndicators(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingIndicators(false);
        }
    }

    if (loadingProject) {
        return <div style={{ padding: 40, textAlign: "center" }}>Loading project...</div>;
    }

    if (!project) {
        return <div style={{ padding: 40 }}>Project not found.</div>;
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{ marginBottom: 16, fontSize: "0.9rem", color: "#666" }}>
                <Link to="/projects" style={{ color: "#2563eb", textDecoration: "none" }}>Projects</Link>
                <span style={{ margin: "0 8px" }}>/</span>
                <span>{project.name}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0 }}>{project.name}</h1>
                    <div style={{ color: "#6b7280", marginTop: 8 }}>
                        {project.description || "No description provided."}
                    </div>
                </div>
                <span
                    style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: 9999,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        backgroundColor: project.status === "active" ? "#ecfdf5" : "#f3f4f6",
                        color: project.status === "active" ? "#064e3b" : "#374151",
                        border: `1px solid ${project.status === "active" ? "#d1fae5" : "#e5e7eb"}`,
                    }}
                >
                    {project.status === "active" ? "Active" : "Archived"}
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, marginRight: "auto" }}>Indicators</h2>
                {canMutate && (
                    <Link
                        to={`/indicators/new?project=${project.id}`}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#2563eb",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: 6,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                        }}
                    >
                        + Add Indicator
                    </Link>
                )}
            </div>

            {loadingIndicators ? (
                <div style={{ padding: 24, color: "#6b7280" }}>Loading indicators...</div>
            ) : (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "white" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Section</th>
                                <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Indicator</th>
                                <th style={{ padding: "14px 16px", color: "#4b5563", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {indicators.map((indicator) => (
                                <tr key={indicator.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "14px 16px", fontSize: "0.9rem", color: "#374151" }}>
                                        <div style={{ fontWeight: 600 }}>{indicator.section}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{indicator.standard}</div>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <Link to={`/indicators/${indicator.id}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                                            {indicator.indicator_text}
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
                                                backgroundColor: indicator.due_status === "COMPLIANT" ? "#ecfdf5" : indicator.due_status === "OVERDUE" ? "#fef2f2" : "#fffbeb",
                                                color: indicator.due_status === "COMPLIANT" ? "#064e3b" : indicator.due_status === "OVERDUE" ? "#991b1b" : "#92400e",
                                                border: `1px solid ${indicator.due_status === "COMPLIANT" ? "#d1fae5" : indicator.due_status === "OVERDUE" ? "#fee2e2" : "#fef3c7"}`,
                                            }}
                                        >
                                            {indicator.due_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {indicators.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                                        No indicators assigned to this project yet.
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
