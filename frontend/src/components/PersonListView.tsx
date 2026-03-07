'use client';

import React, { useMemo } from 'react';
import { FilterMode, Person } from '../types';

interface PersonListViewProps {
    persons: Person[];
    filterMode: FilterMode;
}

const PersonListView: React.FC<PersonListViewProps> = ({ persons, filterMode }) => {
    const filteredPersons = useMemo(() => {
        if (!persons) return [];
        // Bạn có thể thêm logic lọc theo filterMode tại đây nếu cần
        return persons;
    }, [persons, filterMode]);

    if (!persons) {
        return <div className="p-4 text-center text-gray-500">Đang tải dữ liệu...</div>;
    }

    if (persons.length === 0) {
        return <div className="p-4 text-center text-gray-500">Chưa có thành viên nào.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {filteredPersons.map((person) => (
                <div 
                    key={person._id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center space-x-4"
                >
                    <div className="flex-shrink-0">
                        <img 
                            src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`} 
                            alt={person.name} 
                            className="w-12 h-12 rounded-full object-cover border border-gray-100"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{person.name}</h3>
                        <p className="text-xs text-gray-500 truncate">
                            {person.birthDate ? new Date(person.birthDate).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PersonListView;