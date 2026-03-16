'use client';

import React, { useMemo } from 'react';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';

interface Event {
    date: Date;
    type: 'birth' | 'death' | 'marriage';
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface EventsViewProps {
    persons: Person[];
    spouses: SpouseWithDetails[];
}

const BirthIcon = () => <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-gray-50 z-10 text-lg">👶</div>;
const DeathIcon = () => <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-gray-50 z-10 text-lg">🕊️</div>;
const MarriageIcon = () => <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-gray-50 z-10 text-lg">💍</div>;

const EventsView: React.FC<EventsViewProps> = ({ persons, spouses }) => {
    const events = useMemo(() => {
        const allEvents: Event[] = [];

        // Birth and Death events
        persons.forEach(p => {
            if (p.birth) {
                const birthDate = new Date(p.birth);
                if (!isNaN(birthDate.getTime())) {
                    allEvents.push({
                        date: birthDate,
                        type: 'birth',
                        title: `Chào đời: ${p.name}`,
                        description: `Thành viên mới của gia tộc đã ra đời.`,
                        icon: <BirthIcon />,
                    });
                }
            }
            if (p.death) {
                const deathDate = new Date(p.death);
                if (!isNaN(deathDate.getTime())) {
                    allEvents.push({
                        date: deathDate,
                        type: 'death',
                        title: `Từ trần: ${p.name}`,
                        description: `Gia tộc tiễn đưa một thành viên về nơi an nghỉ.`,
                        icon: <DeathIcon />,
                    });
                }
            }
        });

        // Marriage events
        spouses.forEach(s => {
            if (s.marriageDate) {
                const marriageDate = new Date(s.marriageDate);
                if (!isNaN(marriageDate.getTime())) {
                    const husband = typeof s.husband === 'object' ? s.husband : null;
                    const wife = typeof s.wife === 'object' ? s.wife : null;
                    if (husband && wife) {
                         allEvents.push({
                            date: marriageDate,
                            type: 'marriage',
                            title: `Kết hôn: ${husband.name} & ${wife.name}`,
                            description: `Một gia đình mới được hình thành.`,
                            icon: <MarriageIcon />,
                        });
                    }
                }
            }
        });

        // Sort events from newest to oldest
        return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [persons, spouses]);

    if (events.length === 0) {
        return <div className="p-10 text-center text-gray-500">Chưa có sự kiện nào được ghi nhận.</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-full">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-10 tracking-tight">Dòng thời gian Sự kiện Gia tộc</h2>
                <div className="relative border-l-4 border-blue-100 ml-5 space-y-8 pb-10">
                    {events.map((event, index) => (
                        <div key={index} className="ml-10 relative group">
                            <div className="absolute -left-[59px] top-0 transition-transform duration-300 group-hover:scale-110">{event.icon}</div>
                            <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                                event.type === 'birth' ? 'border-l-4 border-l-blue-500' : 
                                event.type === 'death' ? 'border-l-4 border-l-gray-500' : 'border-l-4 border-l-pink-500'
                            }`}>
                                <time className="text-sm font-semibold text-gray-500">
                                    {event.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </time>
                                <h3 className="text-lg font-semibold text-gray-900 mt-1">{event.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventsView;