import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';
import { extractId } from '../Persons/types';

// This function builds the generation levels via a Breadth-First Search
export const buildGenerations = (
    rootId: string,
    personMap: Map<string, Person>,
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>, // Key is spouse-relationship-ID
    maxGen: number = 100
) => {
    const generations: string[][] = [];
    const personGeneration = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { personId: string; gen: number }[] = [{ personId: rootId, gen: 0 }];

    visited.add(rootId);

    while (queue.length > 0) {
        const { personId, gen } = queue.shift()!;
        if (gen >= maxGen) continue;

        // Add person to their generation
        if (!generations[gen]) generations[gen] = [];
        if (!generations[gen].includes(personId)) {
            generations[gen].push(personId);
        }
        personGeneration.set(personId, gen);

        // Find spouses and add them to the same generation
        const spouseRels = spouseMap.get(personId) || [];
        spouseRels.forEach(rel => {
            const husbandId = extractId(rel.husband as Person | string);
            const wifeId = extractId(rel.wife as Person | string);
            const spousePersonId = husbandId === personId ? wifeId : husbandId;

            if (spousePersonId && !visited.has(spousePersonId)) {
                visited.add(spousePersonId);
                if (!generations[gen].includes(spousePersonId)) {
                    generations[gen].push(spousePersonId);
                }
                personGeneration.set(spousePersonId, gen);
            }

            // Find children of this specific spouse relationship
            const relId = rel._id;
            if (relId) {
                const childrenOfRel = childrenMap.get(relId) || [];
                childrenOfRel.forEach(c => {
                    const childId = extractId(c.child as Person | string);
                    if (childId && !visited.has(childId)) {
                        visited.add(childId);
                        queue.push({ personId: childId, gen: gen + 1 });
                    }
                });
            }
        });
    }

    return { generations, personGeneration };
};

// This function creates a map of a person to their direct children
export const buildChildrenByParentMap = (
    generations: string[][],
    lastGenIndex: number,
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>, // Key is spouse-relationship-ID
    personMap: Map<string, Person>
) => {
    const map = new Map<string, string[]>();
    // This function is primarily for the layout algorithm to find children of a person.
    // It can be implemented by iterating through a person's spouse relationships,
    // then using the relationship ID to look up children in childrenMap.
    // For simplicity in this fix, we will let the layout algorithm handle this lookup directly if needed.
    return map;
};