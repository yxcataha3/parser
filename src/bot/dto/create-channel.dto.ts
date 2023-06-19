export class CreateChannelDto {
    id: bigInt.BigInteger;
    access_hash: bigInt.BigInteger;
    title: string;
    username: string;
    link: string;
}