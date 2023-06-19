import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity()
export class Message {

    @Column({primary: true, nullable: false, unique: true, unsigned: true, type: 'bigint'})
    id: bigInt.BigInteger;

    @Column({nullable: true, type: 'text'})
    text: string;

    @Column({nullable: true, type: 'text'})
    reply_markup: string;

    @Column({nullable: true, type: 'text'})
    entities: string;
    
    @ManyToOne(() => Channel, (ch) => ch.messages, {eager: false, cascade: ['remove']})
    channel: Channel;

    @CreateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

}
