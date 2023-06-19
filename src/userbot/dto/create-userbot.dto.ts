export class CreateUserbotDto {
    id: number;
    first_name: string;
    session: string;
    last_name?: string;
    username?: string;
}