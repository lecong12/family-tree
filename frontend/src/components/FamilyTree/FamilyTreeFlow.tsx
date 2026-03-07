        // Bản sửa lỗi logic gán nhãn hôn nhân
        const spouseLabelsCount = new Map<string, number>();

        spouses.forEach((spouse) => {
            const husbandId = extractId(spouse.husband as Person | string);
            const wifeId = extractId(spouse.wife as Person | string);

            // Xử lý nhãn cho người Chồng (Để hiện V1, V2 cho các bà vợ)
            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                const count = (spouseLabelsCount.get(husbandId) || 0) + 1;
                spouseLabelsCount.set(husbandId, count);
                
                // Gán nhãn Vợ (V)
                spouse.label = `V${count}`; 
                spouseMap.get(husbandId)!.push(spouse);
            }

            // Xử lý nhãn cho người Vợ (Để hiện C1, C2 cho các ông chồng)
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                if (!spouse.label) { // Nếu chưa được gán nhãn từ phía chồng
                    const count = (spouseLabelsCount.get(wifeId) || 0) + 1;
                    spouseLabelsCount.set(wifeId, count);
                    
                    // Gán nhãn Chồng (C)
                    spouse.label = `C${count}`;
                }
                spouseMap.get(wifeId)!.push(spouse);
            }
        });
