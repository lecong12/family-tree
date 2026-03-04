import { Gender } from 'src/constants';
import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';

/**
 * Map gender value to Gender enum
 */
export const mapGender = (genderValue: any): Gender => {
    if (genderValue === 0 || genderValue === '0') return Gender.MALE;
    if (genderValue === 1 || genderValue === '1') return Gender.FEMALE;
    return Gender.MALE;
};

/**
 * Sort spouses by order or marriage date
 * For a husband with multiple wives: sort by wifeOrder (wife 1, wife 2, ...)
 * For a wife with multiple husbands: sort by husbandOrder (husband 1, husband 2, ...)
 */
export const sortSpouses = (spouses: SpouseWithDetails[], personId: string): SpouseWithDetails[] => {
    if (spouses.length === 0) return [];

    return [...spouses].sort((a, b) => {
        const aHusbandId = typeof a.husband === 'string' ? a.husband : a.husband?._id;
        const bHusbandId = typeof b.husband === 'string' ? b.husband : b.husband?._id;

        // Check if the common person is the husband
        if (aHusbandId === personId && bHusbandId === personId) {
            // We are sorting the marriages of a husband, so use husbandOrder
            return (a.husbandOrder || 1) - (b.husbandOrder || 1);
        }

        const aWifeId = typeof a.wife === 'string' ? a.wife : a.wife?._id;
        const bWifeId = typeof b.wife === 'string' ? b.wife : b.wife?._id;

        // Check if the common person is the wife
        if (aWifeId === personId && bWifeId === personId) {
            // We are sorting the marriages of a wife, so use wifeOrder
            return (a.wifeOrder || 1) - (b.wifeOrder || 1);
        }

        // Fallback for mixed cases or if personId doesn't match
        const orderA = a.wifeOrder || a.husbandOrder || 1;
        const orderB = b.wifeOrder || b.husbandOrder || 1;
        if (orderA !== orderB) return orderA - orderB;

        // Fall back to marriage date
        if (a.marriageDate && b.marriageDate) {
            return new Date(a.marriageDate).getTime() - new Date(b.marriageDate).getTime();
        }
        return 0;
    });
};

/**
 * Sort children by birth date
 */
export const sortChildrenByBirthDate = (children: ParentChildWithDetails[], personMap: Map<string, Person>): ParentChildWithDetails[] => {
    return children.sort((a, b) => {
        const childA = typeof a.child === 'string' ? personMap.get(a.child) : a.child;
        const childB = typeof b.child === 'string' ? personMap.get(b.child) : b.child;

        if (!childA?.birth || !childB?.birth) return 0;

        const dateA = new Date(childA.birth).getTime();
        const dateB = new Date(childB.birth).getTime();

        return dateA - dateB;
    });
};

/**
 * Extract child ID from ParentChildWithDetails
 */
export const getChildId = (pc: ParentChildWithDetails): string | undefined => {
    return typeof pc.child === 'string' ? pc.child : pc.child._id;
};

/**
 * Extract spouse person ID (the other person in the relationship)
 */
export const getSpousePersonId = (spouse: SpouseWithDetails, personId: string): string | undefined => {
    const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
    const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;
    return husbandId === personId ? wifeId : husbandId;
};
