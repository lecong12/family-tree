/**
 * Defines the filter modes available for viewing the person list/tree.
 * - 'all': Show all members.
 * - 'isolated': Show only members with no parent/child connections.
 */
export type FilterMode = 'all' | 'isolated';

/**
 * Defines the gender types used across the application.
 * Corresponds to backend enum: MALE = 0, FEMALE = 1.
 */
export type Gender = 0 | 1 | 'MALE' | 'FEMALE';

/**
 * Represents a person in the family tree. This is the single source of truth.
 */
export interface Person {
    _id: string;
    name: string;
    gender?: Gender;
    avatar?: string;
    cccd?: string;
    birth?: string | Date;
    death?: string | Date;
    isDead?: boolean;
    address?: string;
    desc?: string;
}

/**
 * Represents a spouse relationship, populated with person details.
 */
export interface SpouseWithDetails {
    _id: string;
    husband: Person;
    wife: Person;
    marriageDate?: string;
    divorceDate?: string;
    husbandOrder?: number;
    wifeOrder?: number;
}

/**
 * Represents a parent-child relationship, with details.
 */
export interface ParentChild {
    _id: string;
    parent: Person;
    child: Person;
}