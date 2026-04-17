export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type ZoneType =
  | "ensemble"
  | "volume"
  | "facade"
  | "interior"
  | "structural"
  | "decorative"
  | "services";

export type HeritageSensitivity = "low" | "medium" | "high" | "critical";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type ValidationStatus =
  | "draft"
  | "under_review"
  | "validated"
  | "rejected";

export type ObservationStatus =
  | "recorded"
  | "triaged"
  | "linked"
  | "closed";

export type PathologyStatus =
  | "identified"
  | "under_study"
  | "decided"
  | "under_treatment"
  | "stabilized";

export type InterventionStatus =
  | "planned"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type LabTestStatus =
  | "requested"
  | "in_lab"
  | "completed"
  | "cancelled";

export type RiskStatus = "open" | "mitigating" | "closed" | "accepted";

export type MediaType = "photo" | "scan" | "drone" | "plan";

export interface ProjectMetrics {
  zonesCount: number;
  observationsOpen: number;
  decisionsPending: number;
  interventionsActive: number;
  documentsCount: number;
  risksOpen: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  monumentType: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  stakeholders: string[];
  coverImage: string;
  metrics: ProjectMetrics;
}

export interface Zone {
  id: string;
  projectId: string;
  name: string;
  code: string;
  parentZoneId: string | null;
  type: ZoneType;
  heritageSensitivity: HeritageSensitivity | null;
  status: "stable" | "monitoring" | "critical" | "intervention";
  description: string;
  referencePlan: string;
  thumbnail: string;
  mapRef: string;
  counts: {
    observations: number;
    pathologies: number;
    interventions: number;
    documents: number;
    media: number;
    elements: number;
  };
}

export interface ArchitecturalElement {
  id: string;
  zoneId: string;
  name: string;
  type: string;
  material: string;
  description: string;
  status: "sound" | "degraded" | "under_work" | "restored";
  photoIds: string[];
}

export interface Observation {
  id: string;
  projectId: string;
  zoneId: string;
  elementId: string | null;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  observedAt: string;
  author: string;
  photoIds: string[];
  linkedPathologyIds: string[];
  linkedDocumentIds: string[];
  status: ObservationStatus;
}

export interface Pathology {
  id: string;
  projectId: string;
  zoneId: string;
  elementId: string | null;
  type: string;
  description: string;
  causeHypothesis: string;
  severity: Severity;
  status: PathologyStatus;
  relatedObservationIds: string[];
}

export interface Decision {
  id: string;
  projectId: string;
  zoneId: string;
  observationId: string;
  pathologyId: string | null;
  title: string;
  decisionType: string;
  doctrinalPrinciple: string;
  justification: string;
  decisionDate: string;
  decidedBy: string;
  validationStatus: ValidationStatus;
  attachedPV: string | null;
  impacts: string[];
  nextActions: string[];
  linkedDocumentIds: string[];
}

export interface Intervention {
  id: string;
  projectId: string;
  zoneId: string;
  elementId: string | null;
  decisionId: string;
  pathologyId: string | null;
  type: string;
  description: string;
  company: string;
  lead: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  status: InterventionStatus;
  beforeMediaIds: string[];
  afterMediaIds: string[];
  relatedLogbookEntryIds: string[];
}

export interface LogbookEntry {
  id: string;
  projectId: string;
  date: string;
  title: string;
  weather: string;
  activeZones: string[];
  workforce: string;
  summary: string;
  events: string[];
  decisionsTaken: string[];
  interventionsPerformed: string[];
  mediaIds: string[];
}

export interface LabTest {
  id: string;
  projectId: string;
  zoneId: string;
  materialId: string;
  type: string;
  laboratory: string;
  requestedAt: string;
  receivedAt: string | null;
  attachedReport: string | null;
  status: LabTestStatus;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  origin: string;
  compatibility: string;
  notes: string;
  technicalSheet: string | null;
}

export interface Document {
  id: string;
  projectId: string;
  zoneId: string | null;
  type: string;
  title: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  fileType: string;
  size: string;
  version: string;
}

export interface Media {
  id: string;
  projectId: string;
  zoneId: string | null;
  type: MediaType;
  title: string;
  date: string;
  photographer: string;
  tags: string[];
  beforeAfterGroup: "before" | "during" | "after" | null;
  url: string;
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  organization: string;
  contact: string;
  scope: string;
}

export interface Risk {
  id: string;
  projectId: string;
  zoneId: string | null;
  title: string;
  category: string;
  probability: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  impact: "negligible" | "minor" | "moderate" | "major" | "catastrophic";
  mitigation: string;
  owner: string;
  status: RiskStatus;
}

export interface Retex {
  id: string;
  projectId: string;
  title: string;
  lessonLearned: string;
  recommendation: string;
  relatedZoneId: string | null;
  relatedInterventionId: string | null;
  date: string;
  author: string;
  tags: string[];
}
