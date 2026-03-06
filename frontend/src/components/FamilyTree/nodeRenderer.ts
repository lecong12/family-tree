import { Node, Edge } from '@xyflow/react';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';

const NODE_HEIGHT = 100;
const Y_SPACING = 150;

export const renderFamilyTree = (
    generations: string[][],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>, // Key is spouse-relationship-ID
    personGeneration: Map<string, number>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>, // unused
    personMap: Map<string, Person>
) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processedRels = new Set<string>();

    // 1. Create Person Nodes
    personMap.forEach((person, pId) => {
        const x = nodeXPositions.get(pId);
        const gen = personGeneration.get(pId);
        if (x !== undefined && gen !== undefined) {
            nodes.push({
                id: pId,
                type: 'person',
                position: { x, y: gen * (NODE_HEIGHT + Y_SPACING) },
                data: { ...person },
            });
        }
    });

    // 2. Create Relationship Nodes and Edges
    personMap.forEach((_, pId) => {
        const spouseRels = spouseMap.get(pId) || [];
        spouseRels.forEach(rel => {
            const hId = typeof rel.husband === 'string' ? rel.husband : rel.husband?._id;
            const wId = typeof rel.wife === 'string' ? rel.wife : rel.wife?._id;
            const relId = rel._id;

            if (!hId || !wId || !relId || processedRels.has(relId)) return;
            
            const x = relationshipXPositions.get(relId);
            const gen = personGeneration.get(pId);

            if (x !== undefined && gen !== undefined) {
                processedRels.add(relId);

                // Relationship Node (the diamond)
                nodes.push({
                    id: relId,
                    type: 'relationship',
                    position: { x, y: gen * (NODE_HEIGHT + Y_SPACING) + (NODE_HEIGHT / 2) - 10 },
                    data: { ...rel },
                });

                // Edges from spouses to relationship node
                edges.push({ id: `e-${hId}-${relId}`, source: hId, target: relId, type: 'smoothstep', style: { stroke: '#cbd5e1' } });
                edges.push({ id: `e-${wId}-${relId}`, source: wId, target: relId, type: 'smoothstep', style: { stroke: '#cbd5e1' } });

                // Edges from relationship node to children
                const childrenOfRel = childrenMap.get(relId) || [];
                childrenOfRel.forEach(c => {
                    const childId = typeof c.child === 'string' ? c.child : c.child?._id;
                    if (childId) {
                        edges.push({ id: `e-${relId}-${childId}`, source: relId, target: childId, type: 'smoothstep', style: { stroke: '#94a3b8' } });
                    }
                });
            }
        });
    });

    return { nodes, edges };
};