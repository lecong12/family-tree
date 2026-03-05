'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Node,
    Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import PersonNode, { TPersonNode } from '@/components/PersonNode/PersonNode';
import RelationshipNode, { TRelationshipNode } from '@/components/RelationshipNode/RelationshipNode';
import { buildTree } from '@/utils/buildTree';
import { Person } from '@/schema/Person';
import { SearchBar } from './SearchBar';

const nodeTypes = {
    person: PersonNode,
    relationship: RelationshipNode,
};

interface FamilyTreeProps {
    person: Person;
}

export default function FamilyTree({ person }: FamilyTreeProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView, setCenter, getNode } = useReactFlow();

    const { initialNodes, initialEdges } = useMemo(() => {
        if (!person) return { initialNodes: [], initialEdges: [] };
        return buildTree(person);
    }, [person]);

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
    }, [nodes, fitView]);

    const onNodeClick = (event: React.MouseEvent, node: Node) => {
        console.log('Clicked node', node);
        // You can add logic here to show details of the person
    };

    const focusNode = useCallback((nodeId: string) => {
        const node = getNode(nodeId);
        if (node) {
            const x = node.position.x + (node.width ?? 0) / 2;
            const y = node.position.y + (node.height ?? 0) / 2;
            setCenter(x, y, { zoom: 1.2, duration: 800 });
        }
    }, [getNode, setCenter]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <SearchBar onNodeSelect={focusNode} />
            <ReactFlow
                nodes={nodes as (TPersonNode | TRelationshipNode)[]}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                className="bg-gray-100"
            >
            </ReactFlow>
        </div>
    );
}