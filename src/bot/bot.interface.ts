export enum BotScene {
    MAIN = 'main',
    CONNECT_USERBOT = 'connect_userbot',
    DISCONNECT_USERBOT = 'disconnect_userbot',
    ADD_CHANNELS = 'add_channels',
}
export enum ChannelStatus {
    NEW = 'new',
    LOADING_MESSAGES = 'loading_messages',
    MESSAGES_LOADED = 'messages_loaded',
    DONE = 'done',
}