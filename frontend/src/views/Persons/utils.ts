import { Person, SpouseWithDetails, ParentChildWithDetails } from '../../types';
import { extractId } from './types';

export const buildConnectedIds = (
    persons: Person[],
    spouses: SpouseWithDetails[],
    parentChilds: ParentChildWithDetails[]
): Set<string> => {
    const connectedIds = new Set<string>();

    const add = (id: string | undefined) => {
        if (id) connectedIds.add(id);
    };

    // 1. Thêm những người có quan hệ vợ chồng
    if (spouses) {
        spouses.forEach((spouse) => {
            add(extractId(spouse.husband));
            add(extractId(spouse.wife));
        });
    }

    // 2. Thêm những người là con trong quan hệ cha-con
    if (parentChilds) {
        parentChilds.forEach((pc) => {
            add(extractId(pc.child));
        });
    }

    // 3. Fallback: Kiểm tra các trường dữ liệu cũ trong Person (nếu có)
    if (persons) {
        persons.forEach((person) => {
            if (
                person.parentId ||
                (person.children && person.children.length > 0) ||
                (person.spouses && person.spouses.length > 0)
            ) {
                add(person._id);
            }
        });
    }

    return connectedIds;
};

/**
 * Extracts the year from a date string.
 * @param dateString The date string (e.g., "2023-10-27T00:00:00.000Z")
 * @returns The year as a number, or 'N/A' if the date is invalid.
 */
export const getBirthYear = (dateString?: string): number | string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.getFullYear() : 'N/A';
};