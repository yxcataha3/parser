import { Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity()
export class Userbot {

    @Column({primary: true, nullable: false, unique: true, unsigned: true, type: 'int'})
    id: number;

    @Column({nullable: false, type: 'text'})
    first_name: string;
    
    @Column({nullable: true, type: 'text'})
    last_name: string;

    @Column({nullable: true, type: 'text'})
    username: string;
    
    @Column({nullable: false, type: 'text'})
    session: string;

    @CreateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

}
