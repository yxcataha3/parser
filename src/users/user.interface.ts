export enum UserRole {
    USER = 'user',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
}

export interface IUsersStatus {
    allUsers: number,
    activeUsers: number,
    userSource: IUserSource[],
    userSourceDays: number,
}

export interface IUserSource {
    start_deep_link: string,
    count: number
}