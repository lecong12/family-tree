'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import FamilyTree from '@/components/FamilyTree/FamilyTree';
import { SearchBar } from '@/components/FamilyTree/SearchBar';
import { getPersonBySlug } from '@/services/person.service';
import { Person } from '@/schema/Person';

function TreeView({ person }: { person: Person }) {
    const { setCenter, getNode } = useReactFlow();

    const focusNode = useCallback((nodeId: string) => {
        const node = getNode(nodeId);
        if (node) {
            const x = node.position.x + (node.width ?? 0) / 2;
            const y = node.position.y + (node.height ?? 0) / 2;
            setCenter(x, y, { zoom: 1.2, duration: 800 });
        } else {
            console.warn(`Không tìm thấy node với ID: ${nodeId} trên cây`);
        }
    }, [getNode, setCenter]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <SearchBar onNodeSelect={focusNode} />
            <FamilyTree person={person} />
        </div>
    );
}

export default function FamilyTreePage({ params }: { params: { slug: string } }) {
    const [person, setPerson] = useState<Person | null>(null);

    useEffect(() => {
        if (params.slug) {
            getPersonBySlug(params.slug).then(setPerson).catch(err => {
                console.error("Failed to fetch person data", err);
                // Handle error, e.g., show a not found message
            });
        }
    }, [params.slug]);

    if (!person) {
        return <div>Đang tải dữ liệu gia phả...</div>;
    }

    return (
        <ReactFlowProvider>
            <TreeView person={person} />
        </ReactFlowProvider>
    );
}