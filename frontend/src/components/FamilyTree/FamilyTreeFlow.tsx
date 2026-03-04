import { Background, BackgroundVariant, MiniMap, ReactFlow, Node, Edge } from '@xyflow/react';
import { useMemo, useCallback } from 'react';
import PersonNode from 'src/components/PersonNode/PersonNode';
import RelationshipNode from 'src/components/RelationshipNode/RelationshipNode';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';

interface FamilyTreeFlowProps {
    persons: Person[];
    spouses: SpouseWithDetails[];
    parentChilds: ParentChildWithDetails[];
    searchRootPersonId: string | null;
    searchGenerations: number | null;
    onPersonNodeClick: (personData: any) => void;
    onRelationshipNodeClick: (spouseData: any) => void;
}

const FamilyTreeFlow: React.FC<FamilyTreeFlowProps> = ({ persons, spouses, parentChilds, searchRootPersonId, searchGenerations, onPersonNodeClick, onRelationshipNodeClick }) => {
    const nodeTypes = useMemo(() => ({
        relationship: RelationshipNode,
        person: PersonNode,
    }), []);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'person' && node.data) {
            onPersonNodeClick(node.data);
        } else if (node.type === 'relationship' && node.data) {
            onRelationshipNodeClick(node.data);
        }
    }, [onPersonNodeClick, onRelationshipNodeClick]);

    const { nodes, edges } = useMemo(() => {
        if (persons.length === 0) {
            return { nodes: [], edges: [] };
        }

        // --- CONSTANTS ---
        const NODE_WIDTH = 220;
        const NODE_HEIGHT = 100;
        const X_SPACING = 40;
        const Y_SPACING = 150;

        // --- STEP 1: DATA INDEXING ---
        const ROOT_PERSON_ID = searchRootPersonId || persons.find((p) => p.cccd == '0x00001')?._id || persons[0]?._id;
        if (!ROOT_PERSON_ID) {
            console.error('Could not determine a root person for the family tree. Check if data is available and has IDs.');
            return { nodes: [], edges: [] };
        }

        const personMap = new Map<string, Person>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();
        const childrenMap = new Map<string, ParentChildWithDetails[]>();
        const spouseIdMap = new Map<string, SpouseWithDetails>();

        persons.forEach((p) => p._id && personMap.set(p._id, p));

        spouses.forEach((spouse) => {
            if (spouse._id) spouseIdMap.set(spouse._id, spouse);
            const husbandId = spouse.husband?._id || spouse.husband;
            const wifeId = spouse.wife?._id || spouse.wife;
            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                spouseMap.get(husbandId)!.push(spouse);
            }
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                spouseMap.get(wifeId)!.push(spouse);
            }
        });

        parentChilds.forEach((pc) => {
            const parentRelId = pc.parent?._id || pc.parent;
            const spouseRel = spouseIdMap.get(parentRelId);
            if (spouseRel) {
                const husbandId = spouseRel.husband?._id || spouseRel.husband;
                const wifeId = spouseRel.wife?._id || spouseRel.wife;
                if (husbandId) {
                    if (!childrenMap.has(husbandId)) childrenMap.set(husbandId, []);
                    childrenMap.get(husbandId)!.push(pc);
                }
                if (wifeId) {
                    if (!childrenMap.has(wifeId)) childrenMap.set(wifeId, []);
                    childrenMap.get(wifeId)!.push(pc);
                }
            }
        });

        // --- STEP 2: BUILD GENERATIONS (BFS) ---
        const generations: string[][] = [];
        const personGeneration = new Map<string, number>();
        const visited = new Set<string>();
        const queue: { id: string; gen: number }[] = [{ id: ROOT_PERSON_ID, gen: 0 }];
        visited.add(ROOT_PERSON_ID);

        while (queue.length > 0) {
            const { id, gen } = queue.shift()!;
            if (!generations[gen]) generations[gen] = [];
            if (!generations[gen].includes(id)) {
                generations[gen].push(id);
            }
            personGeneration.set(id, gen);

            const spouseRels = spouseMap.get(id) || [];
            spouseRels.forEach((rel) => {
                const husbandId = rel.husband?._id || rel.husband;
                const wifeId = rel.wife?._id || rel.wife;
                const spouseId = husbandId === id ? wifeId : husbandId;
                if (spouseId && !visited.has(spouseId)) {
                    visited.add(spouseId);
                    if (!generations[gen].includes(spouseId)) {
                        generations[gen].push(spouseId);
                    }
                    personGeneration.set(spouseId, gen);
                }
            });

            const directChildren = childrenMap.get(id) || [];
            directChildren.forEach((c) => {
                const childId = c.child?._id || c.child;
                if (childId && !visited.has(childId)) {
                    visited.add(childId);
                    queue.push({ id: childId, gen: gen + 1 });
                }
            });
        }

        // --- STEP 3: CALCULATE POSITIONS ---
        const nodePositions = new Map<string, { x: number; y: number }>();
        const relationshipPositions = new Map<string, { x: number; y: number }>();

        generations.forEach((genIds, genIndex) => {
            const y = genIndex * (NODE_HEIGHT + Y_SPACING);
            let currentX = 0;
            const processedInGen = new Set<string>();

            genIds.forEach((personId) => {
                if (processedInGen.has(personId)) return;

                const group = [personId];
                const spouseRels = spouseMap.get(personId) || [];
                spouseRels.forEach((rel) => {
                    const husbandId = rel.husband?._id || rel.husband;
                    const wifeId = rel.wife?._id || rel.wife;
                    const spouseId = husbandId === personId ? wifeId : husbandId;
                    if (spouseId && genIds.includes(spouseId) && !processedInGen.has(spouseId)) {
                        group.push(spouseId);
                    }
                });

                const groupWidth = group.length * NODE_WIDTH + (group.length - 1) * X_SPACING;
                let groupCurrentX = currentX;

                for (let i = 0; i < group.length; i++) {
                    const pId = group[i];
                    nodePositions.set(pId, { x: groupCurrentX, y });
                    processedInGen.add(pId);

                    if (i < group.length - 1) {
                        const nextPId = group[i + 1];
                        const relId = [pId, nextPId].sort().join('_');
                        const relX = groupCurrentX + NODE_WIDTH + X_SPACING / 2 - 20;
                        relationshipPositions.set(relId, { x: relX, y: y + NODE_HEIGHT / 2 - 20 });
                    }
                    groupCurrentX += NODE_WIDTH + X_SPACING;
                }
                currentX += groupWidth + X_SPACING * 2;
            });
        });

        // --- STEP 4: RENDER NODES AND EDGES ---
        const finalNodes: Node[] = [];
        const finalEdges: Edge[] = [];
        const processedRels = new Set<string>();

        personMap.forEach((p, pId) => {
            if (nodePositions.has(pId)) {
                finalNodes.push({ id: pId, type: 'person', position: nodePositions.get(pId)!, data: { ...p } });

                const spouseRels = spouseMap.get(pId) || [];
                spouseRels.forEach((rel) => {
                    const husbandId = rel.husband?._id || rel.husband;
                    const wifeId = rel.wife?._id || rel.wife;
                    if (!husbandId || !wifeId) return;

                    const relId = [husbandId, wifeId].sort().join('_');
                    if (processedRels.has(relId) || !relationshipPositions.has(relId)) return;
                    processedRels.add(relId);

                    finalNodes.push({ id: relId, type: 'relationship', position: relationshipPositions.get(relId)!, data: { ...rel } });
                    finalEdges.push({ id: `e-${husbandId}-${relId}`, source: husbandId, target: relId, type: 'smoothstep', style: { stroke: '#FFC0CB' } });
                    finalEdges.push({ id: `e-${wifeId}-${relId}`, source: wifeId, target: relId, type: 'smoothstep', style: { stroke: '#FFC0CB' } });

                    const husbandChildIds = new Set((childrenMap.get(husbandId) || []).map((c) => c.child?._id || c.child));
                    const wifeChildren = childrenMap.get(wifeId) || [];
                    wifeChildren.forEach((c) => {
                        const childId = c.child?._id || c.child;
                        if (childId && husbandChildIds.has(childId)) {
                            finalEdges.push({ id: `e-${relId}-${childId}`, source: relId, target: childId, type: 'smoothstep', style: { stroke: '#a1a1aa' } });
                        }
                    });
                });
            }
        });

        return { nodes: finalNodes, edges: finalEdges };
    }, [persons, spouses, parentChilds, searchRootPersonId, searchGenerations]);

    return (
        <>
            <style>{`
                .react-flow__node[data-id^="gen_"] .react-flow__handle {
                    display: none !important;
                }
            `}</style>
            <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges} onNodeClick={handleNodeClick}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
            </ReactFlow>
        </>
    );
};

export default FamilyTreeFlow;
