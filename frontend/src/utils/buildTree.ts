import { Node, Edge } from '@xyflow/react';
import { Person } from '../schema/Person';

export const buildTree = (persons: Person[] | Person) => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Trường hợp truyền vào 1 danh sách (964 người)
    if (Array.isArray(persons)) {
        persons.forEach((person, index) => {
            const personId = person._id || `gen-${index}`;
            
            // 1. Tạo Node cho từng người
            initialNodes.push({
                id: personId,
                type: 'person',
                data: person,
                // Tạm thời xếp hàng ngang, bạn có thể dùng thư viện dagre để tự động dàn trang sau
                position: { x: index * 250, y: (person.generation || 0) * 150 },
            });

            // 2. Tạo Edge (đường nối) nếu tìm thấy cha hợp lệ
            if (person.parentId) {
                // KIỂM TRA QUAN TRỌNG: Chỉ nối nếu ID cha có tồn tại trong danh sách
                const parentExists = persons.some(p => p._id === person.parentId);
                
                if (parentExists) {
                    initialEdges.push({
                        id: `e-${person.parentId}-${personId}`,
                        source: person.parentId,
                        target: personId,
                        animated: true,
                        style: { stroke: '#2ecc71' },
                    });
                } else {
                    // Log nhẹ để bạn biết ai đang bị lỗi dữ liệu mà không làm treo trình duyệt
                    console.warn(`Bỏ qua liên kết lỗi: Người ${person.full_name} có cha ID ${person.parentId} nhưng không tìm thấy cha này.`);
                }
            }
        });
    } 
    // Trường hợp chỉ có 1 người duy nhất (người gốc)
    else if (persons) {
        initialNodes.push({
            id: persons._id || 'root',
            type: 'person',
            data: persons,
            position: { x: 0, y: 0 },
        });
    }

    return { initialNodes, initialEdges };
};