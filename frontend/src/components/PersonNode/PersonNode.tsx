'use client';

import { Handle, NodeProps, Position } from '@xyflow/react';
import Image from 'next/image';
import React from 'react';
import { PersonNodeHeight, PersonNodeWidth } from 'src/constants';
import { PersonInfo } from 'src/schema/PersonInfo';
import { isMale } from 'src/utils/genderUtils';

export default function PersonNode(props: { data: PersonInfo & { _id?: string }, onClick?: any }) {
    const { data } = props;

    // Link ảnh dự phòng "bất tử"
    const MALE_ICON = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
    const FEMALE_ICON = 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png';

    const checkMale = isMale(data.gender);

    // Logic lấy ảnh: Ưu tiên ảnh trong DB -> Nếu lỗi/thiếu thì dùng Icon cố định
    const avatarSrc = (data.avatar && data.avatar.startsWith('http')) 
        ? data.avatar 
        : (checkMale ? MALE_ICON : FEMALE_ICON);

    return (
        <div
            className={`relative border-2 ${checkMale ? 'border-blue-500' : 'border-pink-500'} bg-white rounded-md p-2 text-center shadow-md`}
            style={{ width: PersonNodeWidth, height: PersonNodeHeight }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            
            <div className="relative mb-1">
                <img
                    src={avatarSrc}
                    alt={data.name}
                    className={`rounded-full mx-auto w-[50px] h-[50px] object-cover ${data.isDead ? 'grayscale' : ''}`}
                    onError={(e) => {
                        // Nếu link ảnh bị chết (404), ép hiện icon mặc định
                        (e.target as HTMLImageElement).src = checkMale ? MALE_ICON : FEMALE_ICON;
                    }}
                />
                {data.isDead && (
                    <div className="absolute top-[-5px] left-1/2 -translate-x-1/2">
                        <span className="text-yellow-500 text-xs">✨</span>
                    </div>
                )}
            </div>

            <p className="text-sm font-bold truncate">{data.name}</p>
            <p className="text-[10px] text-gray-400">{data.isDead ? 'Đã mất' : 'Còn sống'}</p>

            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
}
