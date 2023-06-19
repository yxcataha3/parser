import { AfterLoad, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { SceneSession } from 'telegraf/typings/scenes';
import { EMPTY_SESSION } from '../user.constants';
import { UserRole } from '../user.interface';

@Entity()
export class User {

    @Column({primary: true, nullable: false, unique: true, unsigned: true, type: 'bigint'})
    id: number;

    @Column({nullable: false, type: 'text'})
    first_name: string;
    
    @Column({nullable: true, type: 'text'})
    last_name: string;

    @Column({nullable: true, type: 'text'})
    username: string;

    @Column({nullable: false, type: 'boolean', default: false})
    is_admin: boolean;

    @Column({nullable: false, type: 'boolean', default: false})
    started: boolean;

    @Column({nullable: false, type: 'text', default: ''})
    start_deep_link: string;

    @Column({nullable: true, type: 'text'})
    last_deep_link: string;

    @Column({nullable: true, type: 'text'})
    start_date: Date;

    @Column({nullable: false, type: 'text', default: 'ru'})
    lang: string = 'ru';

    @Column({nullable: true, type: 'int', unsigned: true})
    last_message_id: number;

    @Column({nullable: false, type: 'text'})
    last_activity_date: Date;
    
    @Column({nullable: false, type: 'text', default: JSON.stringify(EMPTY_SESSION)})
    session: string | SceneSession;

    @CreateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "text", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @AfterLoad()
    parseSession() {
        if (typeof this.session !== 'string') {
            return;
        }
        this.session = JSON.parse(this.session);
    }

    @BeforeUpdate()
    @BeforeInsert()
    stringifySession() {
        if (typeof this.session === 'string') {
            return;
        }
        this.session = JSON.stringify(this.session);
    }

}
