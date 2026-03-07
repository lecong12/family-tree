'use client';

import React, { useEffect, useMemo } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Node,
    Edge,
    NodeTypes,
    Controls,
    Background,
    MiniMap,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import PersonNode from '../PersonNode/PersonNode';
import RelationshipNode from '../RelationshipNode/RelationshipNode';
import { buildTree } from '../../utils/buildTree';
import { Person, FilterMode, SpouseWithDetails, ParentChildWithDetails } from '../../types';

// Hàm hỗ trợ lấy ID an toàn
const extractId = (obj: string | Person | undefined): string | undefined => {
    if (!obj) return undefined;
    return typeof obj === 'string' ? obj : obj._id;
};

interface FamilyTreeFlowProps {
    persons: Person[];
    spouses?: SpouseWithDetails[];
    parentChilds?: ParentChildWithDetails[];
    filterMode: FilterMode;
    onRelationshipClick?: (spouse: SpouseWithDetails) => void;
    onPersonClick?: (person: Person) => void;
}

export default function FamilyTreeFlow({ 
    persons, 
    spouses = [], 
    parentChilds = [], 
    filterMode,
    onRelationshipClick,
    onPersonClick
}: FamilyTreeFlowProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView } = useReactFlow();

    // Định nghĩa Node Types và truyền callback click
    const nodeTypes = useMemo<NodeTypes>(() => ({
        person: (props: any) => (
            <PersonNode 
                {...props} 
                onClick={() => {
                    if (onPersonClick && props.data) {
                        // Tìm person object từ ID hoặc truyền thẳng data nếu có
                        const person = persons.find(p => p._id === props.id) || props.data;
                        onPersonClick(person);
                    }
                }}
            />
        ),
        relationship: (props: any) => (
            <RelationshipNode 
                {...props} 
                onClick={() => {
                    if (onRelationshipClick && props.data?.spouse) {
                        onRelationshipClick(props.data.spouse);
                    }
                }} 
            />
        ),
    }), [onRelationshipClick, onPersonClick, persons]);

    // Xử lý dữ liệu và xây dựng đồ thị
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!persons || persons.length === 0) return { initialNodes: [], initialEdges: [] };

        // 1. Xử lý Logic V1, V2, C1, C2
        const spouseLabelsCount = new Map<string, number>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();

        // Clone spouses để không ảnh hưởng data gốc và gán label
        // Sử dụng (spouses || []) để đảm bảo an toàn nếu spouses là undefined
        const processedSpouses = (spouses || []).map(s => ({ ...s, label: '' }));

        processedSpouses.forEach((spouse) => {
            const husbandId = extractId(spouse.husband);
            const wifeId = extractId(spouse.wife);

            // Xử lý nhãn cho người Chồng (Để hiện V1, V2 cho các bà vợ)
            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                const count = (spouseLabelsCount.get(husbandId) || 0) + 1;
                spouseLabelsCount.set(husbandId, count);
                
                // Gán nhãn Vợ (V)
                spouse.label = `V${count}`; 
                spouseMap.get(husbandId)!.push(spouse);
            }

            // Xử lý nhãn cho người Vợ (Để hiện C1, C2 cho các ông chồng)
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                // Nếu chưa có label (ưu tiên label từ phía chồng trước)
                if (!spouse.label) {
                     // Logic bổ sung nếu cần
                }
            }
        });

        // 2. Gọi hàm buildTree
        // Lưu ý: Hàm buildTree cần được cập nhật để nhận danh sách persons, spouses, parentChilds
        // Nếu buildTree cũ chỉ nhận 1 tham số, bạn cần cập nhật file src/utils/buildTree.ts
        return buildTree(persons, processedSpouses, parentChilds); 

    }, [persons, spouses, parentChilds]);

    useEffect(() => {
        if (initialNodes.length > 0) {
            setNodes(initialNodes);
            setEdges(initialEdges);
            
            // Fit view sau khi render
            setTimeout(() => {
                fitView({ duration: 800, padding: 0.2 });
            }, 100);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

    return (
        <div className="w-full h-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2.0}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls showInteractive={false} />
                <MiniMap 
                    nodeColor={(n) => {
                        if (n.type === 'person') return '#3b82f6';
                        if (n.type === 'relationship') return '#ef4444';
                        return '#e2e8f0';
                    }}
                />
            </ReactFlow>
        </div>
    );
}
