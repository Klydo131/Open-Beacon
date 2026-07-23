// The whole data model — three roles and one flat list of people. Deliberately
// tiny: this project is a teaching demo, not a product.

export type Role = 'coordinator' | 'guide' | 'member';

export interface Person {
  id: string;
  name: string;
  role: Role;
  guide_id?: string; // for members: the guide supporting them
  stage_index: number; // for members: where they are on the journey
}

export interface Store {
  people: Person[];
}

export const ROLE_LABEL: Record<Role, string> = {
  coordinator: 'Coordinator',
  guide: 'Guide',
  member: 'Member',
};
