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

            setCenter(x, y, { zoom: 1.0, duration: 1000 });
        } else {
            console.warn(`Không tìm thấy node với ID: ${nodeId} để focus.`);
        }
    }, [getNode, setCenter]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <SearchBar onNodeSelect={focusNode} />
            <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
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

        // Find ROOT_PERSON_ID
        const ROOT_PERSON_ID = searchRootPersonId || persons.find((p) => p.cccd == '0x00001')?._id || persons[0]?._id;
        if (!ROOT_PERSON_ID) {
            console.error('Could not determine a root person for the family tree. Check if data is available and has IDs.');
            return { nodes: [], edges: [] };
        }

        // Build maps
        const personMap = new Map<string, Person>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();
        const childrenMap = new Map<string, ParentChildWithDetails[]>();

        persons.forEach((p) => p._id && personMap.set(p._id, p));

        spouses.forEach((spouse) => {
            const husbandId = extractId(spouse.husband as Person | string);
            const wifeId = extractId(spouse.wife as Person | string);

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
            const parentId = typeof pc.parent === 'string' ? pc.parent : pc.parent?._id;
            if (parentId) {
                if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
                childrenMap.get(parentId)!.push(pc);
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
