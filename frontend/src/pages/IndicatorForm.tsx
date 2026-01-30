import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchIndicator, createIndicator, updateIndicator, fetchProjects, Project } from "../api";
import { useToast } from "../components/Toast";

export default function IndicatorForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        project: searchParams.get("project") || "",
        section: "",
        standard: "",
        indicator_text: "",
        evidence_required_text: "",
        responsible_person: "",
        frequency: "ONE_TIME",
        is_active: true
    });

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchIndicator(id)
                .then(indicator => {
                    setFormData({
                        project: indicator.project || "",
                        section: indicator.section,
                        standard: indicator.standard,
                        indicator_text: indicator.indicator_text,
                        evidence_required_text: indicator.evidence_required_text || "",
                        responsible_person: indicator.responsible_person || "",
                        frequency: indicator.frequency,
                        is_active: indicator.is_active
                    });
                })
                .catch(err => showToast(err.message, "error"))
                .finally(() => setLoading(false));
        }
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, project: formData.project || null };
            if (id) {
                await updateIndicator(id, payload);
                showToast("Indicator updated", "success");
            } else {
                await createIndicator(payload);
                showToast("Indicator created", "success");
            }
            navigate("/");
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <h1>{id ? "Edit Indicator" : "Add New Indicator"}</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Project</label>
                    <select
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.project}
                        onChange={e => setFormData({ ...formData, project: e.target.value })}
                    >
                        <option value="">Unassigned</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Section</label>
                    <input
                        required
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.section}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Standard</label>
                    <input
                        required
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.standard}
                        onChange={e => setFormData({ ...formData, standard: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Indicator Text</label>
                    <textarea
                        required
                        rows={3}
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.indicator_text}
                        onChange={e => setFormData({ ...formData, indicator_text: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Evidence Required</label>
                    <textarea
                        rows={3}
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.evidence_required_text}
                        onChange={e => setFormData({ ...formData, evidence_required_text: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Responsible Person</label>
                    <input
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.responsible_person}
                        onChange={e => setFormData({ ...formData, responsible_person: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Frequency</label>
                    <select
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        value={formData.frequency}
                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    >
                        <option value="ONE_TIME">One-time</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="ANNUALLY">Annually</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                        {loading ? "Saving..." : "Save Indicator"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
