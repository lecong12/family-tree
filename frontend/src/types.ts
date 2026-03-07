/**
 * Defines the filter modes available for viewing the person list/tree.
 * - 'all': Show all members.
 * - 'isolated': Show only members with no parent/child connections.
 */
export type FilterMode = 'all' | 'isolated';

/**
 * Represents a person in the family tree.
 */
export interface Person {
    _id: string;
    name: string;
    gender?: string | number;
    avatar?: string;
    cccd?: string;
    birth?: string | Date;
    death?: string | Date;
    isDead?: boolean;
    birthDate?: string;
    deathDate?: string;
    parentId?: string;
    children?: string[];
    spouses?: string[];
}

/**
 * Represents a spouse relationship, potentially populated with person details.
 */
export interface SpouseWithDetails {
    _id: string;
    husband: Person | string;
    wife: Person | string;
    marriageDate?: string;
    divorceDate?: string;
    husbandOrder?: number;
    wifeOrder?: number;
}

/**
 * Represents a parent-child relationship.
 */
export interface ParentChildWithDetails {
    _id: string;
    parent: string; // This is the ID of the spouse relationship
    child: Person | string;
}