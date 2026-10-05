// `class-validator`/`class-transformer` usam `Reflect.getMetadata`, que só
// existe depois de `reflect-metadata` ser importado. Precisa vir antes de
// qualquer DTO ser avaliado pelos decorators.
import 'reflect-metadata';
