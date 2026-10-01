/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: 'https://kzcmrro7sine2i3tqbzch2y3jq0ozjjc.lambda-url.us-east-2.on.aws/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
};
