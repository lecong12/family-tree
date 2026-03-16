import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender } from '../../../constants';

export type PersonDocument = HydratedDocument<Person>;

@Schema({ timestamps: true })
export class Person {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ type: Number, enum: Gender, required: true })
    gender: Gender;

    @Prop({ unique: true, sparse: true, trim: true })
    cccd: string;

    @Prop()
    birth: Date;

    @Prop()
    death: Date;

    @Prop({ default: false })
    isDead: boolean;

    @Prop()
    avatar: string;

    @Prop()
    address: string;

    @Prop()
    desc: string;

    @Prop()
    phone: string;

    @Prop()
    job: string;

    @Prop()
    generation: number;

    @Prop()
    branch: string;

    @Prop()
    order: number;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

// Thêm index để tối ưu tìm kiếm theo tên
PersonSchema.index({ name: 'text' });