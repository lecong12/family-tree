import type { Person } from 'src/services/personService';
import type { SpouseWithDetails } from 'src/services/spouseService';
import type { ParentChild, ParentChildWithDetails } from 'src/services/parentChildService';

export interface PersonDetailsData {
    person: Person;
    spouses: (SpouseWithDetails & { children: ParentChildWithDetails[] })[];
    parents: (ParentChild & { parent: SpouseWithDetails })[];
}