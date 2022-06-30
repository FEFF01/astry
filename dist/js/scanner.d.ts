export { Scanner, OPERATIONS, HOOK_MODE, IScanEnv, IPattern, Token, IPosition, ISourceLocation, UseKey, unwrapTokens };
declare type IScanEnv = {
    tokens: Array<any>;
    input: string;
    begin: number;
    offset: number;
    end: number;
    line: number;
    column: number;
    useFold: boolean;
    useEscape: boolean;
    ignoreCase: boolean;
    hookPoint: number;
};
declare const enum HOOK_MODE {
    RESOLVE = 1,
    CAPTURE = 2,
    PIPE = 4
}
interface IPosition {
    offset: number;
    line: number;
    column: number;
}
interface ISourceLocation {
    start: IPosition;
    end: IPosition;
}
declare type IPattern = Hook | string | String | Array<string | Array<IPattern>>;
declare abstract class Hook {
    mode: HOOK_MODE;
    abstract use(env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition): any;
}
declare class Node extends Hook {
    type: string;
    map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any;
    private useContent?;
    static NODE_MAP: {};
    Wrapper: any;
    constructor(type: string, map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any, useContent?: boolean);
    use(env: IScanEnv, start: IPosition, end: IPosition): void;
}
declare class UseKey {
    key: string;
    value: any;
    constructor(key: string, value: any);
}
declare class Key extends Hook {
    key: string;
    map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any;
    static Wrapper: typeof UseKey;
    constructor(key: string, map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any);
    use(env: IScanEnv, start: IPosition, end: IPosition): void;
}
declare class Merge extends Hook {
    map: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any;
    constructor(map: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any);
    use(env: IScanEnv, start: IPosition, end: IPosition): void;
}
declare class Prev extends Hook {
    match?: (token: Token | any, env: IScanEnv) => number | boolean;
    onlyToken?: boolean;
    constructor(match?: (token: Token | any, env: IScanEnv) => number | boolean, onlyToken?: boolean);
    use(env: IScanEnv): void;
}
declare class Pipe extends Hook {
    pipe: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any;
    mode: HOOK_MODE;
    constructor(pipe: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any);
    use(env: IScanEnv, start: IPosition, end: IPosition): void;
}
declare class Pick extends Pipe {
    mode: HOOK_MODE;
}
declare class Call extends Hook {
    use: (env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition) => any;
    mode: HOOK_MODE;
    constructor(use: (env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition) => any, mode: HOOK_MODE);
}
declare namespace OPERATIONS {
    const FINISH: String, WRAP: String, UNWRAP: String, UNWRAP_ALL: String, OPTION: String, SPLIT: String, NO_COLLECT: String, NO_CAPTURE: String, MARK_AS_ROOT: String, FORK_IN_PARENT: String, FORK_IN_ROOT: String, END: String, END_ON_LEFT: String;
    const useKey: (key: string | Token, value: any) => UseKey;
    const node: (val: string, map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any, useContent?: boolean, mode?: HOOK_MODE) => Node, key: (val: string, map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) => Key, pick: (map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) => Pick, hook: (fn: (env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition) => void, mode?: HOOK_MODE) => Call, pipe: (pipe?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) => Pipe, prev: (match?: (token: Token | any, env: IScanEnv) => number | boolean, onlyToken?: boolean) => Prev, merge: (map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any) => Merge;
    const MATCH_BEGIN = "", MATCH_END = "", MATCH_EOF: IPattern, MERGE_ALL_TOKENS: Merge, UNFOLD: Call;
}
declare class Scanner {
    private scanTree;
    useEscape: boolean;
    useFold: boolean;
    ignoreCase: boolean;
    constructor(pattern: IPattern, configure?: {
        useEscape?: boolean;
        useFold?: boolean;
        ignoreCase?: boolean;
    });
    scan(options: IScanEnv | string): IScanEnv;
}
declare class Token {
    value: string;
    loc: ISourceLocation;
    constructor(value: string, start: IPosition, end: IPosition);
    trim(): Token;
    concat(token: Token): Token;
    slice(beginIndex: number, endIndex?: number): Token;
    toString(): string;
}
declare function unwrapTokens(tokens: any): any;
