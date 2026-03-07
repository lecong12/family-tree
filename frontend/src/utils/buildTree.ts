import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { Person, SpouseWithDetails, ParentChildWithDetails } from '../types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const RELATIONSHIP_NODE_WIDTH = 40;
const RELATIONSHIP_NODE_HEIGHT = 40;

const extractId = (obj: string | Person | undefined): string | undefined => {
    if (!obj) return undefined;
    return typeof obj === 'string' ? obj : obj._id;
};

export const buildTree = (
    persons: Person[],
    spouses: SpouseWithDetails[],
    parentChilds: ParentChildWithDetails[]
): { initialNodes: Node[]; initialEdges: Edge[] } => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 });

    // 1. Add nodes to Dagre graph
    persons.forEach((person) => {
        dagreGraph.setNode(person._id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    spouses.forEach((spouse) => {
        dagreGraph.setNode(spouse._id, {
            width: RELATIONSHIP_NODE_WIDTH,
            height: RELATIONSHIP_NODE_HEIGHT,
        });
    });

    // 2. Add edges to Dagre graph
    spouses.forEach((spouse) => {
        const husbandId = extractId(spouse.husband);
        const wifeId = extractId(spouse.wife);
        if (husbandId && wifeId) {
            // Edges from persons to the relationship node
            dagreGraph.setEdge(husbandId, spouse._id);
            dagreGraph.setEdge(wifeId, spouse._id);
        }
    });

    parentChilds.forEach((parentChild) => {
        const childId = extractId(parentChild.child);
        if (childId && parentChild.parent) {
            // Edge from the relationship node to the child
            dagreGraph.setEdge(parentChild.parent, childId);
        }
    });

    // 3. Calculate layout
    dagre.layout(dagreGraph);

    // 4. Create React Flow nodes from Dagre graph
    const initialNodes: Node[] = [];
    dagreGraph.nodes().forEach((nodeId) => {
        const node = dagreGraph.node(nodeId);
        const person = persons.find(p => p._id === nodeId);
        const spouse = spouses.find(s => s._id === nodeId);

        if (person) {
            initialNodes.push({
                id: person._id,
                type: 'person',
                position: { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 },
                data: { ...person },
            });
        } else if (spouse) {
            initialNodes.push({
                id: spouse._id,
                type: 'relationship',
                position: { x: node.x - RELATIONSHIP_NODE_WIDTH / 2, y: node.y - RELATIONSHIP_NODE_HEIGHT / 2 },
                data: { spouse }, // Pass the whole spouse object to the node
            });
        }
    });

    // 5. Create React Flow edges
    const initialEdges: Edge[] = [];
    spouses.forEach((spouse) => {
        const husbandId = extractId(spouse.husband);
        const wifeId = extractId(spouse.wife);
        if (husbandId && wifeId) {
            initialEdges.push({
                id: `edge-${husbandId}-${spouse._id}`,
                source: husbandId,
                target: spouse._id,
                type: 'smoothstep',
            });
            initialEdges.push({
                id: `edge-${wifeId}-${spouse._id}`,
                source: wifeId,
                target: spouse._id,
                type: 'smoothstep',
            });
        }
    });

    parentChilds.forEach((parentChild) => {
        const childId = extractId(parentChild.child);
        if (childId && parentChild.parent) {
            initialEdges.push({
                id: `edge-${parentChild.parent}-${childId}`,
                source: parentChild.parent,
                target: childId,
                type: 'smoothstep',
            });
        }
    });

    return { initialNodes, initialEdges };
};