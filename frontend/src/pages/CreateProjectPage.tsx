import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api";
import { useToast } from "../components/Toast";

export default function CreateProjectPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "active",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const project = await createProject(formData);
            showToast("Project created", "success");
            navigate(`/projects/${project.id}`);
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <h1>Create Project</h1>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <label style={{ display: "block", marginBottom: 4 }}>Project Name</label>
                    <input
                        required
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4 }}>Description</label>
                    <textarea
                        rows={4}
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4 }}>Status</label>
                    <select
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: "10px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                    >
                        {loading ? "Saving..." : "Create Project"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ padding: "10px 20px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
