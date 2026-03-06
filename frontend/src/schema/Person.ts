export interface Person {
    _id: string;
    name: string;
    gender: number;
    birth?: string | Date;
    death?: string | Date;
    avatar?: string;
    address?: string;
    desc?: string;
    cccd?: string;
    slug?: string;
    isDead?: boolean;
    // Thêm các trường khác tùy theo model backend của bạn
}