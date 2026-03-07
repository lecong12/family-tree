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
import { Person, SpouseWithDetails, ParentChildWithDetails } from '../../types';
import { useFamilyData } from '../../hooks/useFamilyData';

const nodeTypes: NodeTypes = {
    person: PersonNode,
    relationship: RelationshipNode,
};

interface FamilyTreeProps {
    person?: Person; // Giữ prop này để tránh lỗi ở nơi gọi cũ, nhưng có thể không dùng đến
}

export default function FamilyTree({ person }: FamilyTreeProps) {
    // Sử dụng hook để lấy toàn bộ dữ liệu thay vì chỉ phụ thuộc vào prop person
    const { persons, spouses, parentChilds } = useFamilyData();
    
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView } = useReactFlow();

    const { initialNodes, initialEdges } = useMemo(() => {
        // Gọi buildTree với đầy đủ 3 tham số
        if (!persons || persons.length === 0) return { initialNodes: [], initialEdges: [] };
        return buildTree(
            persons as unknown as Person[], 
            (spouses || []) as unknown as SpouseWithDetails[], 
            (parentChilds || []) as unknown as ParentChildWithDetails[]
        );
    }, [persons, spouses, parentChilds]);

    useEffect(() => {
        if (initialNodes.length > 0) {
            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    useEffect(() => {
        // Fit view after nodes are set
        const timeout = setTimeout(() => {
            fitView({ duration: 800 });
        }, 100);
        return () => clearTimeout(timeout);
    }, [nodes, fitView]); // nodes thay đổi thì fit lại view

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
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}