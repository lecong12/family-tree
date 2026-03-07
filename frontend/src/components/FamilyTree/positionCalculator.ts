import { Person, SpouseWithDetails, ParentChildWithDetails } from '../../types';

const NODE_WIDTH = 220;
const X_SPACING = 40;

export const calculateNodePositions = (
    generations: string[][],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    _childrenByParent: Map<string, string[]>,
    _personMap: Map<string, Person>
) => {
    const nodeXPositions = new Map<string, number>();
    const relationshipXPositions = new Map<string, number>();
    const spouseNodeXPositions = new Map<string, number>(); // This seems unused

    generations.forEach((gen, genIndex) => {
        let currentX = 0;
        const processedInGen = new Set<string>();

        gen.forEach(pId => {
            if (processedInGen.has(pId)) return;

            // Position the person
            nodeXPositions.set(pId, currentX);
            processedInGen.add(pId);
            
            // Position their spouses next to them, creating space for each new family unit
            const spouseRels = spouseMap.get(pId) || [];
            // Sort spouses by order to handle polygamy consistently (v1, v2, etc.)
            spouseRels.sort((a, b) => (a.husbandOrder || a.wifeOrder || 1) - (b.husbandOrder || b.wifeOrder || 1));

            currentX += NODE_WIDTH + X_SPACING;

            spouseRels.forEach(rel => {
                const hId = typeof rel.husband === 'string' ? rel.husband : rel.husband?._id;
                const wId = typeof rel.wife === 'string' ? rel.wife : rel.wife?._id;
                const spouseId = hId === pId ? wId : hId;

                if (spouseId && !processedInGen.has(spouseId) && personGeneration.get(spouseId) === genIndex) {
                    nodeXPositions.set(spouseId, currentX);
                    processedInGen.add(spouseId);

                    // Add relationship node between them
                    const relId = rel._id;
                    if (relId) {
                        const x1 = nodeXPositions.get(pId)!;
                        // Place it exactly in the middle of the space between them
                        relationshipXPositions.set(relId, x1 + NODE_WIDTH + X_SPACING / 2 - 20); // 20 is half rel node width
                    }
                    
                    currentX += NODE_WIDTH + X_SPACING;
                }
            });
        });
    });

    return { nodeXPositions, relationshipXPositions, spouseNodeXPositions };
};