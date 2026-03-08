'use client';

import { Alert, Button, Card, Spinner, Table, Badge } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import { HiUserGroup, HiViewList, HiExclamation } from 'react-icons/hi';
import api from '../../services/api'; // Giả định api instance được export từ đây

// Định nghĩa kiểu dữ liệu để code rõ ràng hơn
interface Person {
    _id: string;
    name: string;
    // Các thuộc tính khác của person
}

interface SpouseRelation {
    _id: string;
    husband: string; // ID của Person
    wife: string;    // ID của Person
}

interface ParentChildRelation {
    _id:string;
    parent: string; // ID của SpouseRelation
    child: string;  // ID của Person
}

export default function PersonsPage() {
    const [persons, setPersons] = useState<Person[]>([]);
    const [spouses, setSpouses] = useState<SpouseRelation[]>([]);
    const [parentChildren, setParentChildren] = useState<ParentChildRelation[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Tải song song các dữ liệu cần thiết
                const [personsRes, spousesRes, parentChildrenRes] = await Promise.all([
                    api.get('/persons'),
                    api.get('/spouses'),
                    api.get('/parent-child-relations'),
                ]);

                setPersons(personsRes.data);
                setSpouses(spousesRes.data);
                setParentChildren(parentChildrenRes.data);
            } catch (err: any) {
                setError('Không thể tải dữ liệu từ server. Vui lòng thử lại. Lỗi: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- FIX 1: Sửa logic xác định thành viên "chưa liên hệ" ---
    const linkedPersonIds = useMemo(() => {
        const ids = new Set<string>();

        // Một người được coi là "đã liên hệ" nếu họ là vợ, chồng, hoặc con.
        // Cha mẹ cũng được tính vì họ phải nằm trong một mối quan hệ vợ chồng.
        spouses.forEach(rel => {
            if (rel.husband) ids.add(rel.husband);
            if (rel.wife) ids.add(rel.wife);
        });

        parentChildren.forEach(rel => {
            if (rel.child) ids.add(rel.child);
        });

        return ids;
    }, [spouses, parentChildren]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center p-10">
                    <Spinner size="xl" />
                    <p className="mt-4 text-gray-600">Đang tải danh sách thành viên...</p>
                </div>
            );
        }

        if (error) {
            return <Alert color="failure" className="mt-4">
                <span className="font-medium">Lỗi!</span> {error}
            </Alert>;
        }

        // --- FIX 2: Kích hoạt chức năng xem Cây gia phả ---
        if (viewMode === 'tree') {
            return (
                <Card className="mt-4 text-center">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Cây Gia Phả
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Tính năng này đang được phát triển và sẽ sớm được ra mắt.
                    </p>
                </Card>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table hoverable className="mt-4 min-w-full">
                    <Table.Head>
                        <Table.HeadCell>Họ và Tên</Table.HeadCell>
                        <Table.HeadCell>Trạng thái</Table.HeadCell>
                        <Table.HeadCell>
                            <span className="sr-only">Hành động</span>
                        </Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {persons.map((person) => (
                            <Table.Row key={person._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {person.name}
                                </Table.Cell>
                                <Table.Cell>
                                    {linkedPersonIds.has(person._id) ? (
                                        <Badge color="success">Đã liên hệ</Badge>
                                    ) : (
                                        <Badge color="warning">Chưa liên hệ</Badge>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <a href={`/persons/${person._id}`} className="font-medium text-cyan-600 hover:underline dark:text-cyan-500">
                                        Xem chi tiết
                                    </a>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Thành viên</h1>
                <div className="flex" role="group">
                    <Button color="gray" onClick={() => setViewMode('list')} disabled={viewMode === 'list'} className="rounded-r-none">
                        <HiViewList className="mr-2 h-5 w-5" />
                        Danh sách
                    </Button>
                    <Button color="gray" onClick={() => setViewMode('tree')} disabled={viewMode === 'tree'} className="rounded-l-none border-l-0">
                        <HiUserGroup className="mr-2 h-5 w-5" />
                        Cây gia phả
                    </Button>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}