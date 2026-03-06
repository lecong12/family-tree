import { Node, Edge } from '@xyflow/react';

export const buildTree = (person: any) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    if (person) {
        initialNodes.push({
            id: person._id || 'root',
            type: 'person',
            data: person,
            position: { x: 0, y: 0 },
        });
    }

    return { initialNodes, initialEdges };
};
