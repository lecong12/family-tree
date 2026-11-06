import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { useMemo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import PersonNode from 'src/components/PersonNode/PersonNode';
import RelationshipNode from 'src/components/RelationshipNode/RelationshipNode';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';
import { buildGenerations, buildChildrenByParentMap } from 'src/views/utils/generationBuilder';
import { calculateNodePositions } from 'src/views/utils/positionCalculator';
import { renderFamilyTree } from 'src/views/utils/nodeRenderer';
import { extractId } from 'src/views/Persons/types';
import { SearchBar } from './SearchBar';

interface FamilyTreeFlowProps {
    persons: Person[];
    spouses: SpouseWithDetails[];
    parentChilds: ParentChildWithDetails[];
    searchRootPersonId: string | null;
    searchGenerations: number | null;
    onPersonNodeClick: (personData: any) => void;
    onRelationshipNodeClick: (spouseData: any) => void;
}

// Component nội bộ để có thể sử dụng hook useReactFlow
const FlowWithSearch = ({ nodes, edges, nodeTypes }: { nodes: any[], edges: any[], nodeTypes: any }) => {
    const { setCenter, getNode } = useReactFlow();

    // Hàm để di chuyển và phóng to vào một node trên cây
    const focusNode = useCallback((nodeId: string) => {
        const node = getNode(nodeId);
        if (node) {
            // Tính toán tâm của node (fallback kích thước mặc định nếu chưa render xong)
            const width = node.measured?.width ?? node.width ?? 220;
            const height = node.measured?.height ?? node.height ?? 100;
            const x = node.position.x + width / 2;
            const y = node.position.y + height / 2;

            setCenter(x, y, { zoom: 0.8, duration: 1000 });
        } else {
            console.warn(`Không tìm thấy node với ID: ${nodeId} để focus.`);
        }
    }, [getNode, setCenter]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <SearchBar onNodeSelect={focusNode} />
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
                <MiniMap
                    bgColor="var(--color-bg-secondary)"
                    maskColor="rgba(107, 114, 128, 0.2)"
                    nodeStrokeColor="var(--color-text-secondary)"
                />
                <Background
                    variant={BackgroundVariant.Lines}
                    gap={24}
                    size={1}
                    color="var(--color-border)"
                    bgColor="var(--color-bg-primary)"
                />
            </ReactFlow>
        </div>
    );
}

const FamilyTreeFlow: React.FC<FamilyTreeFlowProps> = ({ persons, spouses, parentChilds, searchRootPersonId, searchGenerations, onPersonNodeClick, onRelationshipNodeClick }) => {
    const nodeTypes = useMemo(
        () => ({
            relationship: (props: any) => <RelationshipNode {...props} onClick={onRelationshipNodeClick} />,
            person: (props: any) => <PersonNode {...props} onClick={onPersonNodeClick} />,
        }),
        [onPersonNodeClick, onRelationshipNodeClick],
    );

    const { nodes, edges } = useMemo(() => {
        if (persons.length === 0) {
            return { nodes: [], edges: [] };
        }

        // Start the full family tree from its founding ancestor unless a search selected another person.
        const ROOT_PERSON_ID =
            searchRootPersonId ||
            persons.find((p) => p.name.trim().toLocaleLowerCase('vi') === 'lê công mao')?._id ||
            persons.find((p) => p.cccd === '0x00001')?._id ||
            persons[0]?._id;
        if (!ROOT_PERSON_ID) {
            console.error('Could not determine a root person for the family tree. Check if data is available and has IDs.');
            return { nodes: [], edges: [] };
        }

        // Build maps
        const personMap = new Map<string, Person>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();
        const childrenMap = new Map<string, ParentChildWithDetails[]>();
        const spouseByPair = new Map<string, SpouseWithDetails>();
        const spousePairById = new Map<string, string>();

        persons.forEach((p) => p._id && personMap.set(p._id, p));

        const getPersonIdentity = (person: Person | string): string => {
            const personData = typeof person === 'string' ? personMap.get(person) : person;
            const personId = extractId(person);
            if (!personData?.name) return personId || '';

            const birthTime = personData.birth ? new Date(personData.birth).getTime() : Number.NaN;
            const birthDate = Number.isFinite(birthTime) ? new Date(birthTime).toISOString().slice(0, 10) : '';
            return `${personData.name.trim().toLocaleLowerCase('vi')}|${personData.gender ?? ''}|${birthDate}`;
        };

        spouses.forEach((spouse) => {
            const husbandId = extractId(spouse.husband as Person | string);
            const wifeId = extractId(spouse.wife as Person | string);
            if (!husbandId || !wifeId || !spouse._id) return;

            const pairKey = [getPersonIdentity(spouse.husband), getPersonIdentity(spouse.wife)].sort().join(':');
            const canonicalSpouse = spouseByPair.get(pairKey);
            spousePairById.set(spouse._id, pairKey);

            if (canonicalSpouse) {
                Object.assign(canonicalSpouse, {
                    husbandOrder: canonicalSpouse.husbandOrder ?? spouse.husbandOrder,
                    wifeOrder: canonicalSpouse.wifeOrder ?? spouse.wifeOrder,
                    marriageDate: canonicalSpouse.marriageDate ?? spouse.marriageDate,
                    divorceDate: canonicalSpouse.divorceDate ?? spouse.divorceDate,
                });
            } else {
                spouseByPair.set(pairKey, spouse);
            }
        });

        spouseByPair.forEach((spouse) => {
            const husbandId = extractId(spouse.husband as Person | string);
            const wifeId = extractId(spouse.wife as Person | string);
            if (!husbandId || !wifeId) return;

            if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
            spouseMap.get(husbandId)!.push(spouse);
            if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
            spouseMap.get(wifeId)!.push(spouse);
        });

        parentChilds.forEach((pc) => {
            const parentId = typeof pc.parent === 'string' ? pc.parent : pc.parent?._id;
            const pairKey = parentId ? spousePairById.get(parentId) : undefined;
            const canonicalSpouse = pairKey ? spouseByPair.get(pairKey) : undefined;
            const canonicalId = canonicalSpouse?._id;
            if (!canonicalId) return;

            const children = childrenMap.get(canonicalId) || [];
            const childId = extractId(pc.child as Person | string);
            if (!children.some((existing) => extractId(existing.child as Person | string) === childId)) {
                children.push(pc);
                childrenMap.set(canonicalId, children);
            }
        });

        // Build generations
        const { generations, personGeneration } = buildGenerations(ROOT_PERSON_ID!, personMap, spouseMap, childrenMap, searchGenerations || undefined);

        // Build children by parent map
        const lastGenIndex = generations.length - 1;
        const childrenByParent = buildChildrenByParentMap(generations, lastGenIndex, spouseMap, childrenMap, personMap);

        // Calculate positions
        const { nodeXPositions, relationshipXPositions, spouseNodeXPositions } = calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent, personMap);

        // Render tree
        return renderFamilyTree(generations, spouseMap, childrenMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
    }, [persons, spouses, parentChilds, searchRootPersonId, searchGenerations]);

    return (
        <>
            <style>{`
                .react-flow__node[data-id^="gen_"] .react-flow__handle {
                    display: none !important;
                }
            `}</style>
            <ReactFlowProvider>
                <FlowWithSearch nodes={nodes} edges={edges} nodeTypes={nodeTypes} />
            </ReactFlowProvider>
        </>
    );
};

export default FamilyTreeFlow;
