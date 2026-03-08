import { Node, Edge, Position } from '@xyflow/react';
import dagre from 'dagre';
import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/views/Persons/types';

// Helper để lấy ID an toàn
const getId = (item: any): string | undefined => (typeof item === 'object' && item !== null ? item._id : item);

export const buildTree = (persons: Person[], spouses: SpouseWithDetails[], parentChilds: ParentChildWithDetails[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Kích thước node để tính toán layout
    const nodeWidth = 220;
    const nodeHeight = 100; 

    // Cấu hình Dagre: TB = Top to Bottom
    dagreGraph.setGraph({ 
        rankdir: 'TB', 
        nodesep: 60, // Khoảng cách ngang giữa các node
        ranksep: 100 // Khoảng cách dọc giữa các thế hệ
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processedPersonIds = new Set<string>();

    // 1. Tạo Nodes cho Persons
    persons.forEach((p) => {
        if (!p._id) return;
        processedPersonIds.add(p._id);
        
        // Đăng ký node với dagre
        dagreGraph.setNode(p._id, { width: nodeWidth, height: nodeHeight });

        nodes.push({
            id: p._id,
            type: 'person',
            data: { ...p, label: p.name },
            position: { x: 0, y: 0 }, // Dagre sẽ ghi đè vị trí này
        });
    });

    // 2. Tạo Nodes và Edges cho quan hệ Vợ Chồng (Marriage)
    spouses.forEach((s) => {
        const husbandId = getId(s.husband);
        const wifeId = getId(s.wife);
        
        // Chỉ vẽ nếu cả 2 người đều có trong danh sách nodes
        if (!husbandId || !wifeId || !processedPersonIds.has(husbandId) || !processedPersonIds.has(wifeId)) return;

        const marriageNodeId = `marriage_${s._id}`;
        
        // Node trung gian cho mối quan hệ (nhỏ hơn node người)
        dagreGraph.setNode(marriageNodeId, { width: 40, height: 40 });
        nodes.push({
            id: marriageNodeId,
            type: 'relationship', 
            data: { spouse: s, label: 'Marriage' },
            position: { x: 0, y: 0 },
        });

        // Edge từ Chồng -> Marriage
        dagreGraph.setEdge(husbandId, marriageNodeId);
        edges.push({
            id: `e_${husbandId}-${marriageNodeId}`,
            source: husbandId,
            target: marriageNodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#9ca3af', strokeWidth: 1.5 },
        });

        // Edge từ Vợ -> Marriage
        dagreGraph.setEdge(wifeId, marriageNodeId);
        edges.push({
            id: `e_${wifeId}-${marriageNodeId}`,
            source: wifeId,
            target: marriageNodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#9ca3af', strokeWidth: 1.5 },
        });
    });

    // 3. Tạo Edges từ Marriage -> Con cái
    parentChilds.forEach((pc) => {
        const marriageNodeId = `marriage_${getId(pc.parent)}`;
        const childId = getId(pc.child);

        // Kiểm tra tồn tại
        const marriageExists = nodes.some(n => n.id === marriageNodeId);
        const childExists = childId && processedPersonIds.has(childId);
        
        if (marriageExists && childExists) {
            dagreGraph.setEdge(marriageNodeId, childId);
            edges.push({
                id: `e_${marriageNodeId}-${childId}`,
                source: marriageNodeId,
                target: childId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
            });
        }
    });

    // 4. Tính toán Layout
    dagre.layout(dagreGraph);

    // 5. Áp dụng tọa độ từ Dagre vào Nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (!nodeWithPosition) return node;

        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - (node.id.startsWith('marriage_') ? 20 : nodeWidth / 2),
                y: nodeWithPosition.y - (node.id.startsWith('marriage_') ? 20 : nodeHeight / 2),
            },
        };
    });

    return { initialNodes: layoutedNodes, initialEdges: edges };
};