export type Role = 'coordinator' | 'guide' | 'member';
export type TextSize = 'small' | 'normal' | 'large';
export type MotionPreference = 'full' | 'reduced';
export type WorkspaceTheme = 'desk' | 'slate' | 'warm' | 'focus';

export interface Person {
  id: string;
  name: string;
  role: Role;
  guide_id?: string;
  stage_index: number;
}

export interface Note {
  id: string;
  author_id: string;
  subject_id: string;
  body: string;
}

export interface Message {
  id: string;
  author_id: string;
  participant_id: string;
  body: string;
}

export interface SupportRequest {
  id: string;
  person_id: string;
  body: string;
  share_anonymously: boolean;
}

export interface Preferences {
  text_size: TextSize;
  motion: MotionPreference;
  workspace_theme: WorkspaceTheme;
}

export interface Store {
  people: Person[];
  completed_task_ids: string[];
  saved_resource_ids: string[];
  notes: Note[];
  messages: Message[];
  support_requests: SupportRequest[];
  preferences: Preferences;
}

export const ROLE_LABEL: Record<Role, string> = {
  coordinator: 'Coordinator',
  guide: 'Guide',
  member: 'Member',
};
