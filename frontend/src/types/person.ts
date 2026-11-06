export const Gender = {
    MALE: 0,
    FEMALE: 1,
} as const;

export type GenderValue = 0 | 1 | 'MALE' | 'FEMALE';
export type Gender = (typeof Gender)[keyof typeof Gender];

export interface Person {
    _id: string;
    name: string;
    gender?: GenderValue;
    avatar?: string;
    birth?: string | Date;
    death?: string | Date;
    birthDate?: string;
    deathDate?: string;
    parentId?: string;
    children?: string[];
    spouses?: string[];
    cccd?: string;
    address?: string;
    desc?: string;
    phone?: string;
    slug?: string;
    isDead?: boolean;
    job?: string;
    generation?: number;
    branch?: string;
    order?: number;
    [key: string]: any;
}

export interface Spouse {
    _id: string;
    husband: Person | string;
    wife: Person | string;
    marriageDate?: string | Date;
    divorceDate?: string | Date;
    husbandOrder?: number;
    wifeOrder?: number;
    [key: string]: any;
}

export interface SpouseWithDetails extends Spouse {
    children?: any[];
    parents?: any[];
}

export interface ParentChild {
    _id: string;
    parent: string;
    child: string;
    isAdopted?: boolean;
    [key: string]: any;
}

export interface ParentChildWithDetails {
    _id: string;
    parent: string | SpouseWithDetails;
    child: Person | string;
    isAdopted?: boolean;
    [key: string]: any;
}

export interface PersonDetailsData {
    spouses: SpouseWithDetails[];
    parents: ParentChildWithDetails[];
    children?: Person[];
    [key: string]: unknown;
}
