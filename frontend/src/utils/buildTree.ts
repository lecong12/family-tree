import { Node, Edge } from '@xyflow/react';
import { Person } from '../schema/Person';

export const buildTree = (persons: Person[] | Person) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Trường hợp truyền vào 1 danh sách (964 người)
    if (Array.isArray(persons)) {
        persons.forEach((p: any, index) => {
            const personId = p._id || `gen-${index}`;
            
            // 1. Tạo Node cho từng người
            initialNodes.push({
                id: personId,
                type: 'person',
                data: p,
                position: { 
                    x: index * 250, 
                    y: (p.generation || 0) * 150 
                },
            });

            // 2. Tạo Edge (đường nối) nếu tìm thấy cha hợp lệ
            if (p.parentId) {
                // Kiểm tra ID cha có tồn tại trong danh sách không
                const parentExists = persons.some((parent: any) => parent._id === p.parentId);
                
                if (parentExists) {
                    initialEdges.push({
                        id: `e-${p.parentId}-${personId}`,
                        source: p.parentId,
                        target: personId,
                        animated: true,
                        style: { stroke: '#2ecc71' },
                    });
                }
            }
        });
    } 
    // Trường hợp chỉ có 1 người duy nhất (người gốc)
    else if (persons) {
        initialNodes.push({
            id: persons._id || 'root',
            type: 'person',
            data: persons as any,
            position: { x: 0, y: 0 },
        });
    }

    return { initialNodes, initialEdges };
};