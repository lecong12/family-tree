export interface Person {
    _id: string;
    name: string;
    gender: number;
    birth: string | Date;
    death?: string | Date;
    cccd?: string;
}