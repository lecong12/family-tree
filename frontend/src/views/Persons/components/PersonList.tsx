import Image from 'next/image';
import { Person } from 'src/services/personService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';
import { getBirthYear } from '../utils';
import { SortDirection, SortField } from '../types';

interface PersonListProps {
    paginated: Person[];
    connectedIds: Set<string>;
    currentPage: number;
    pageSize: number;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onPersonClick: (person: Person) => void;
}

export default function PersonList({ paginated, connectedIds, currentPage, pageSize, sortField, sortDirection, onSort, onPersonClick }: PersonListProps) {
    if (paginated.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <p className="text-lg font-medium">Không tìm thấy thành viên nào</p>
                <p className="text-sm text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg bg-white">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th
                            scope="col"
                                className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-blue-600 hover:bg-gray-200/60 transition-colors"
                            onClick={() => onSort('name')}
                        >
                            <div className="flex items-center gap-1">
                                Thành viên
                                {sortField === 'name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th 
                            scope="col" 
                            className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24 cursor-pointer hover:text-blue-600 hover:bg-gray-200/60 transition-colors"
                            onClick={() => onSort('branch' as any)}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Phái
                                {sortField === 'branch' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th
                            scope="col"
                                className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32 cursor-pointer hover:text-blue-600 hover:bg-gray-200/60 transition-colors"
                            onClick={() => onSort('birth')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Năm sinh
                                {sortField === 'birth' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th
                            scope="col"
                                className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32 cursor-pointer hover:text-blue-600 hover:bg-gray-200/60 transition-colors"
                            onClick={() => onSort('status')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Trạng thái
                                {sortField === 'status' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((person, idx) => {
                        const p = person as any; // Cast to access new fields
                        const isIsolated = p._id ? !connectedIds.has(p._id) : false;
                        const isDeceased = p.isDead === true;
                        const avatarSrc = person.avatar?.trim() ? person.avatar : isMale(person.gender) ? Avatar_Male : Avatar_Female;
                        const birthYear = getBirthYear(person);
                        const borderColor = isMale(person.gender) ? 'border-blue-400' : 'border-pink-400';

                        return (
                            <tr
                                key={person._id ?? idx}
                                onClick={() => onPersonClick(person)}
                                className={`cursor-pointer transition-colors duration-150 odd:bg-white even:bg-gray-50/50 hover:bg-blue-50 ${isIsolated ? 'bg-amber-50 hover:bg-amber-100 even:bg-amber-50/50' : ''}`}
                            >
                                    <td className="px-3 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 h-10 w-10 relative`}>
                                            <Image
                                                className={`rounded-full object-cover border-2 ${borderColor} ${isDeceased ? 'grayscale' : ''} shadow-sm ring-1 ring-white`}
                                                src={avatarSrc}
                                                alt={person.name}
                                                fill
                                                sizes="40px"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className={`text-sm font-medium ${isDeceased ? 'text-gray-500' : 'text-gray-900'}`}>{p.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {isMale(p.gender) ? 'Nam' : 'Nữ'}
                                                {p.generation && ` - Đời ${p.generation}`}
                                                {p.branch && ` - Phái ${p.branch}`}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">{p.cccd || '—'}</div>
                                            {isIsolated && <div className="text-[10px] text-amber-600 font-medium mt-0.5 max-w-[150px] truncate">⚠️ Chưa có liên hệ</div>}
                                        </div>
                                    </div>
                                </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                                    {p.branch && p.branch !== '0' ? (
                                        <span className="px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-purple-100 text-purple-800">
                                            Phái {p.branch}
                                        </span>) : (<span className="text-gray-400">—</span>)
                                    }
                                </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{birthYear || '—'}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-800'}`}>
                                        {isDeceased ? 'Đã mất' : 'Còn sống'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
