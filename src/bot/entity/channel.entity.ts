import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { ChannelStatus } from '../bot.interface';
import { Message } from './message.entity';

@Entity()
export class Channel {

    @Column({primary: true, nullable: false, unique: true, unsigned: true, type: 'bigint'})
    id: bigInt.BigInteger;

    @Column({nullable: false, type: 'bigint'})
    access_hash: bigInt.BigInteger;

    @Column({nullable: false, type: 'text'})
    title: string;

    @Column({nullable: true, type: 'text'})
    username: string;

    @Column({nullable: true, type: 'text'})
    link: string;

    @Column({nullable: true, type: 'text', default: ChannelStatus.NEW})
    status: ChannelStatus;

    @OneToMany(() => Message, (m) => m.channel, {eager: false})
    messages: Message[];

    @CreateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

}
