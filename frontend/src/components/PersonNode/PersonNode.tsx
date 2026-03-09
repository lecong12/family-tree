'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import Image from 'next/image';
import React from 'react';
import { Gender, PersonNodeHeight, PersonNodeWidth } from 'src/constants';
import { Avatar_Female, Avatar_Male } from 'src/constants/imagePaths';
import { PersonInfo } from 'src/schema/PersonInfo';
import { isMale } from 'src/utils/genderUtils';

export type TPersionNode = Omit<Node, 'data' | 'type'> & {
    data: PersonInfo;
    type: 'person';
};

export type PersonNodeProps = Omit<NodeProps, 'data'> & {
    data: PersonInfo & { _id?: string };
    onClick?: (personData: PersonInfo & { _id?: string }) => void;
};

// Link dự phòng từ Internet (Nam xanh - Nữ hồng) nếu file local bị mất
const FALLBACK_MALE = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
const FALLBACK_FEMALE = 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png';

export default function PersonNode(props: PersonNodeProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (props.onClick) {
            props.onClick(props.data);
        }
    };

    // Logic hiển thị Avatar thông minh: 
    // Kiểm tra trường 'avatar' (từ seed) -> nếu không có dùng 'avatarUrl' -> nếu không có dùng ảnh mặc định hệ thống
    const currentGenderIsMale = isMale(props.data.gender);
    
    const avatarSrc = (props.data.avatar && props.data.avatar.trim() !== '') 
        ? props.data.avatar 
        : (currentGenderIsMale ? (Avatar_Male || FALLBACK_MALE) : (Avatar_Female || FALLBACK_FEMALE));

    // Định dạng ngày sinh
    const birthDate = props.data.birth ? (typeof props.data.birth === 'string' ? new Date(props.data.birth) : props.data.birth) : null;
    const birthStr = birthDate ? birthDate.toLocaleDateString('vi-VN') : '';

    // Tính tuổi nếu đã mất
    let ageStr = '';
    if (props.data.isDead && props.data.birth && props.data.death) {
        const birth = new Date(props.data.birth);
        const death = new Date(props.data.death);
        let age = death.getFullYear() - birth.getFullYear();
        const m = death.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
            age--;
        }
        ageStr = `(Hưởng thọ: ${age})`;
    }

    return (
        <div
            className={`relative border-2 ${currentGenderIsMale ? 'border-blue-500' : 'border-pink-500'} bg-white rounded-md p-2 text-center cursor-pointer hover:shadow-lg transition-shadow shadow-sm`}
            style={{ minWidth: PersonNodeWidth, maxWidth: PersonNodeWidth, height: PersonNodeHeight }}
            onClick={handleClick}
        >
            {/* Điểm kết nối phía trên */}
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0 }} />
            
            <div className="relative mb-2">
                <Image
                    src={avatarSrc}
                    alt={props.data.name}
                    width={50}
                    height={50}
                    unoptimized={true} // Cho phép load ảnh từ link ngoài (UI-Avatars/Flaticon)
                    className={`rounded-full mx-auto w-[50px] h-[50px] object-cover border shadow-inner ${props.data.isDead ? 'grayscale opacity-70' : ''}`}
                    onError={(e) => {
                        // Nếu link trong DB bị lỗi 404, lập tức hiện ảnh mặc định giới tính
                        const target = e.target as HTMLImageElement;
                        target.src = currentGenderIsMale ? FALLBACK_MALE : FALLBACK_FEMALE;
                    }}
                />
                
                {/* Hiển thị vòng hào quang nếu đã mất */}
                {props.data.isDead && (
                    <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 z-10">
                        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="20" cy="10" rx="18" ry="6" stroke="#FFD700" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                )}
            </div>

            <p className="text-sm font-bold truncate px-1 text-slate-800">{props.data.name}</p>
            <p className="text-[10px] text-gray-500">{birthStr}</p>
            {ageStr && <p className="text-[10px] font-medium text-gray-600">{ageStr}</p>}
            
            {/* Điểm kết nối phía dưới */}
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0 }} />
        </div>
    );
}
