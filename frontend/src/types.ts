export interface Indicator {
    id: string;
    section: string;
    standard: string;
    indicator_text: string;
    frequency: string; // DAILY, WEEKLY, MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, ADHOC
    due_status: 'COMPLIANT' | 'DUE_SOON' | 'OVERDUE' | 'NOT_STARTED';
    is_active: boolean;
    responsible_person: string;
    evidence_min_rule_json: EvidenceRule;
    ai_prompt_template: string;
    last_compliant_date: string | null;
    next_due_date: string | null;
}

export interface EvidenceRule {
    note?: number;
    file?: number;
    photo?: number;
    screenshot?: number;
    link?: number;
}

export interface ComplianceRecord {
    id: string;
    indicator: string;
    compliant_on: string;
    valid_until: string;
    notes: string;
    created_at: string;
    evidence_count?: number; // Assumed from requirement "Show last 10... evidence count"
}

export interface EvidenceItem {
    id: string;
    indicator: string;
    compliance_record?: string | null;
    evidence_type: 'NOTE' | 'FILE' | 'PHOTO' | 'SCREENSHOT' | 'LINK';
    note_text?: string;
    link_url?: string;
    file?: string; // URL to file
    created_at: string;
}

export interface AuditSummary {
    period: string;
    start_date: string;
    counts: {
        COMPLIANT: number;
        DUE_SOON: number;
        OVERDUE: number;
        NOT_STARTED: number;
    };
    gap_list: Indicator[];
}
