import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const RelationshipNode = ({ data, onClick }: any) => {
    return (
        <div 
            className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-red-400 transition-colors"
            onClick={onClick}
            title="Mối quan hệ hôn nhân"
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="w-2 h-2 bg-white rounded-full" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

export default memo(RelationshipNode);