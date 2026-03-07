        // Logic gán nhãn V1, V2, C1, C2 tự động
        const spouseLabelsCount = new Map<string, number>();

        spouses.forEach((spouse) => {
            const husbandId = extractId(spouse.husband as Person | string);
            const wifeId = extractId(spouse.wife as Person | string);

            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                // Đếm số vợ của ông này
                const count = (spouseLabelsCount.get(husbandId) || 0) + 1;
                spouseLabelsCount.set(husbandId, count);
                spouse.label = `V${count}`; // Gán V1, V2...
                spouseMap.get(husbandId)!.push(spouse);
            }
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                // Nếu chưa có nhãn từ phía chồng, gán nhãn Chồng (C)
                if (!spouse.label) {
                    const count = (spouseLabelsCount.get(wifeId) || 0) + 1;
                    spouseLabelsCount.set(wifeId, count);
                    spouse.label = `C${count}`;
                }
                spouseMap.get(wifeId)!.push(spouse);
            }
        });
