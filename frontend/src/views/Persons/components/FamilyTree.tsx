import React, { useMemo } from 'react';
import { Person } from 'src/services/personService';
import { isMale } from 'src/utils/genderUtils';

interface FamilyTreeProps {
    persons: Person[];
    spouses: any[];
    parentChilds: any[];
    onPersonClick: (person: Person) => void;
}

interface TreeNode {
    person: Person;
    spouses: Person[];
    children: TreeNode[];
}

export default function FamilyTree({ persons, spouses, parentChilds, onPersonClick }: FamilyTreeProps) {
    // Xử lý dữ liệu thành cấu trúc cây
    const treeData = useMemo(() => {
        const personMap = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) personMap.set(p._id, p);
        });

        // Map: ParentID -> List of ChildIDs
        const childrenMap = new Map<string, string[]>();
        parentChilds.forEach((pc: any) => {
            if (!childrenMap.has(pc.parentId)) childrenMap.set(pc.parentId, []);
            childrenMap.get(pc.parentId)?.push(pc.childId);
        });

        // Map: PersonID -> List of SpouseIDs
        const spouseMap = new Map<string, string[]>();
        spouses.forEach((s: any) => {
            // Giả sử cấu trúc spouse có person1Id và person2Id
            // Lưu 2 chiều để dễ tìm
            if (!spouseMap.has(s.person1Id)) spouseMap.set(s.person1Id, []);
            spouseMap.get(s.person1Id)?.push(s.person2Id);

            if (!spouseMap.has(s.person2Id)) spouseMap.set(s.person2Id, []);
            spouseMap.get(s.person2Id)?.push(s.person1Id);
        });

        // Hàm đệ quy dựng node
        const buildNode = (personId: string, visited = new Set<string>()): TreeNode | null => {
            if (visited.has(personId)) return null;
            visited.add(personId);

            const person = personMap.get(personId);
            if (!person) return null;

            // Tìm vợ/chồng
            const spouseIds = spouseMap.get(personId) || [];
            const spouseObjs: Person[] = [];
            spouseIds.forEach((sId) => {
                const s = personMap.get(sId);
                if (s) {
                    spouseObjs.push(s);
                    visited.add(sId); // Đánh dấu vợ/chồng đã xử lý để không lặp lại ở root khác
                }
            });

            // Tìm con
            // Con có thể thuộc về person hiện tại hoặc vợ/chồng của họ
            const childIds = new Set<string>();
            const potentialParents = [personId, ...spouseIds];
            
            potentialParents.forEach(pId => {
                const kids = childrenMap.get(pId);
                if (kids) kids.forEach(k => childIds.add(k));
            });

            const childrenNodes: TreeNode[] = [];
            childIds.forEach((childId) => {
                const node = buildNode(childId, visited); 
                if (node) childrenNodes.push(node);
            });
            
            // Sắp xếp con theo năm sinh
            childrenNodes.sort((a, b) => {
                const dateA = a.person.birth ? new Date(a.person.birth).getTime() : 0;
                const dateB = b.person.birth ? new Date(b.person.birth).getTime() : 0;
                return dateA - dateB;
            });

            return {
                person,
                spouses: spouseObjs,
                children: childrenNodes,
            };
        };

        // Tìm Root: Những người không phải là con của ai trong danh sách hiện tại
        // Hoặc đơn giản là những người không có parentId trong bảng parentChilds
        const allChildIds = new Set<string>();
        parentChilds.forEach((pc: any) => allChildIds.add(pc.childId));

        const roots: TreeNode[] = [];
        const processedIds = new Set<string>();

        persons.forEach((p) => {
            if (p._id && !allChildIds.has(p._id) && !processedIds.has(p._id)) {
                const node = buildNode(p._id, processedIds);
                if (node) roots.push(node);
            }
        });

        return roots;
    }, [persons, spouses, parentChilds]);

    const renderTree = (node: TreeNode) => (
        <li key={node.person._id}>
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 bg-white p-2 rounded shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => onPersonClick(node.person)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isMale(node.person.gender) ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {node.person.name.charAt(0)}
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-sm text-gray-800">{node.person.name}</div>
                        <div className="text-xs text-gray-500">
                            {node.person.birth ? new Date(node.person.birth).getFullYear() : '?'}
                            {node.person.isDead ? ' (Mất)' : ''}
                        </div>
                    </div>
                </div>
                
                {/* Hiển thị vợ/chồng */}
                {node.spouses.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                        {node.spouses.map(spouse => (
                            <div key={spouse._id} className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-600 flex items-center gap-1"
                                 onClick={(e) => { e.stopPropagation(); onPersonClick(spouse); }}>
                                <span className="text-pink-400">♥</span> {spouse.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {node.children.length > 0 && (
                <ul>
                    {node.children.map(child => renderTree(child))}
                </ul>
            )}
        </li>
    );

    return (
        <div className="overflow-auto p-8 bg-gray-100 min-h-[500px] rounded-xl border border-gray-200">
            <style>{`
                .tree ul {
                    padding-top: 20px; position: relative;
                    transition: all 0.5s;
                    display: flex;
                    justify-content: center;
                }
                .tree li {
                    float: left; text-align: center;
                    list-style-type: none;
                    position: relative;
                    padding: 20px 10px 0 10px;
                    transition: all 0.5s;
                }
                /* Connectors */
                .tree li::before, .tree li::after {
                    content: '';
                    position: absolute; top: 0; right: 50%;
                    border-top: 1px solid #ccc;
                    width: 50%; height: 20px;
                }
                .tree li::after {
                    right: auto; left: 50%;
                    border-left: 1px solid #ccc;
                }
                .tree li:only-child::after, .tree li:only-child::before {
                    display: none;
                }
                .tree li:only-child { padding-top: 0; }
                .tree li:first-child::before, .tree li:last-child::after {
                    border: 0 none;
                }
                .tree li:last-child::before{
                    border-right: 1px solid #ccc;
                    border-radius: 0 5px 0 0;
                }
                .tree li:first-child::after{
                    border-radius: 5px 0 0 0;
                }
                .tree ul ul::before{
                    content: '';
                    position: absolute; top: 0; left: 50%;
                    border-left: 1px solid #ccc;
                    width: 0; height: 20px;
                }
            `}</style>
            
            <div className="tree w-max mx-auto">
                <ul>
                    {treeData.map(root => renderTree(root))}
                </ul>
                {treeData.length === 0 && <div className="text-gray-500 text-center mt-10">Không có dữ liệu cây gia phả hoặc chưa có liên kết.</div>}
            </div>
        </div>
    );
}