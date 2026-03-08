import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Image from 'next/image';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';

const PersonNode = ({ data, onClick }: any) => {
    const isNodeMale = isMale(data.gender);
    const avatarSrc = data.avatar || (isNodeMale ? Avatar_Male : Avatar_Female);
    const birthYear = data.birth ? new Date(data.birth).getFullYear() : '';

    return (
        <div 
            className={`relative flex flex-col items-center p-2 bg-white rounded-xl shadow-md border-2 w-[200px] cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 ${
                isNodeMale ? 'border-blue-200 hover:border-blue-400' : 'border-pink-200 hover:border-pink-400'
            }`}
            onClick={onClick}
        >
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />

            <div className="relative w-12 h-12 mb-2">
                <Image
                    src={avatarSrc}
                    alt={data.label}
                    fill
                    className={`rounded-full object-cover border-2 ${isNodeMale ? 'border-blue-500' : 'border-pink-500'}`}
                    sizes="48px"
                />
            </div>
            
            <div className="text-sm font-bold text-gray-800 text-center truncate w-full px-1" title={data.label}>
                {data.label}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isNodeMale ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {isNodeMale ? 'Nam' : 'Nữ'}
                </span>
                {birthYear && <span className="text-[10px] text-gray-500 font-mono">{birthYear}</span>}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
        </div>
    );
};

export default memo(PersonNode);