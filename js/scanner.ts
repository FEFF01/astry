


export {
    Scanner, OPERATIONS, HOOK_MODE, IScanEnv,
    IPattern, Token,
    IPosition, ISourceLocation,
    UseKey, unwrapTokens
}

type IScanEnv = {
    tokens: Array<any>,
    input: string,
    begin: number,
    offset: number,
    end: number,
    line: number,
    column: number,
    useFold: boolean,
    useEscape: boolean,
    ignoreCase: boolean,
    hookPoint: number, // 用于指定当前钩子方法目标 token 位置
}


const enum HOOK_MODE {
    RESOLVE = 0b1,
    CAPTURE = 0b10,
    PIPE = 0b100
    //LEFT_ASSOCIATIVE = 0b101
}

interface IPosition {
    offset: number,
    line: number,
    column: number
}
interface ISourceLocation {
    start: IPosition,
    end: IPosition
}


type IPattern = Hook
    | string
    | String    // 用于在不占用 string 描述空间的基础上，清晰的定义一些操作指令
    | Array<
        string  //  单段字符串不需要在数组内也能简化的声明为一个分支
        | Array<IPattern>    //  其他内容需要被数组包裹
    > // Array 代表 Pattern 内的分支 Pattern


enum SCOPE {
    NODE, START, BEGIN, CURSOR, BACK_POINT, USE_FOLD
}


interface IScope {
    [SCOPE.NODE]: any,
    [SCOPE.START]: IPosition,
    [SCOPE.BEGIN]: IPosition,
    [SCOPE.CURSOR]: IPosition,
    [SCOPE.BACK_POINT]: number,
    [SCOPE.USE_FOLD]: boolean
}

type ISlices = Array<[IPosition, Hook[]]>;

type IResolveState = [any, IPosition, ISlices, number];



abstract class Hook {
    mode: HOOK_MODE = HOOK_MODE.RESOLVE;
    abstract use(env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition): any
}




class Node extends Hook {
    static NODE_MAP = {};
    public Wrapper: any;
    constructor(
        public type: string,
        public map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any,
        private useContent?: boolean
    ) {
        super();
        this.Wrapper = Node.NODE_MAP[type] || (
            Node.NODE_MAP[type] = eval(
                `(function ${type}(){this.type="${type}";})`
            )
        );
    }
    use(env: IScanEnv, start: IPosition, end: IPosition) {

        let { tokens, hookPoint } = env;

        const node = new this.Wrapper();
        node.loc = { start, end };
        let addItem = function (item: UseKey) {
            node[item.key] = item.value;
        }
        if (this.useContent) {
            const content = node.content = [];
            addItem = function (item: UseKey) {
                content.push(item);
            }
        }
        tokens = tokens.splice(hookPoint);
        if (this.map) {
            tokens = this.map(tokens, env, start, end) || tokens;
        }
        walk(tokens);
        env.tokens.push(node);

        function walk(token: any) {
            if (token instanceof Array) {
                token.forEach(walk);
            } else if (token instanceof UseKey) {
                addItem(token);
            }
        }
    }
}

class UseKey {
    constructor(public key: string, public value: any) { }
}

class Key extends Hook {
    static Wrapper = UseKey;
    constructor(public key: string, public map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) {
        super();
    }
    use(env: IScanEnv, start: IPosition, end: IPosition) {
        let { tokens, hookPoint } = env;
        let token = tokens[hookPoint];
        this.map && (token = this.map(token, env, start, end) || token);
        tokens.splice(hookPoint, 1, new UseKey(this.key, token));
    }
}

class Merge extends Hook {
    constructor(public map: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any) {
        super();
    }
    use(env: IScanEnv, start: IPosition, end: IPosition) {
        let { tokens, hookPoint } = env;

        tokens.push(this.map(tokens.splice(hookPoint), env, start, end));
    }
}

class Prev extends Hook {
    constructor(
        public match?: (token: Token | any, env: IScanEnv) => number | boolean,
        public onlyToken?: boolean
    ) {
        super();
    }
    use(env: IScanEnv) {

        let { tokens, hookPoint } = env;
        hookPoint -= 1;
        let prev = tokens[hookPoint];
        if (!this.onlyToken || prev instanceof Token) {
            if (this.match) {
                let res = this.match(prev, env);
                if (res) {
                    if (typeof res === "number" && res !== prev.value.length) {
                        tokens.splice(
                            hookPoint, 1,
                            prev.slice(0, -res), prev.slice(-res)
                        );
                        return;
                    }
                }
            }
            env.hookPoint -= 1;
        }
    }
}
class Pipe extends Hook {
    mode = HOOK_MODE.PIPE;
    constructor(public pipe: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) {
        super();
    }
    use(env: IScanEnv, start: IPosition, end: IPosition) {
        let { tokens, hookPoint } = env;
        let res = this.pipe(tokens[hookPoint], env, start, end);
        if (res !== undefined) {
            tokens[hookPoint] = res;
        } else {
            tokens.splice(hookPoint, 1);
        }
    }
}
class Pick extends Pipe {
    mode = HOOK_MODE.RESOLVE;
}

class Call extends Hook {
    constructor(
        public use: (env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition) => any,
        public mode: HOOK_MODE
    ) {
        super();
    }
}
class NoCapture extends Hook {
    mode = HOOK_MODE.CAPTURE;
    constructor() {
        super()
    }
    use(env: IScanEnv, start: IPosition, end: IPosition) {
        let { tokens, hookPoint } = env;
        tokens.splice(hookPoint, 1);
        if (start.offset < env.offset/*end.offset === env.offset*/) {
            env.offset = start.offset;
            env.line = start.line;
            env.column = start.column;
        }
    }
}

namespace OPERATIONS {
    export const
        FINISH = new String("FINISH"),
        WRAP = new String("WRAP"),
        UNWRAP = new String("UNWRAP"),
        UNWRAP_ALL = new String("UNWRAP_ALL"),
        OPTION = new String("OPTION"),
        SPLIT = new String("SPLIT"),
        NO_COLLECT = new String("NO_COLLECT"),
        NO_CAPTURE = new String("NO_CAPTURE"),
        MARK_AS_ROOT = new String("MARK_AS_ROOT"),
        FORK_IN_PARENT = new String("FORK_IN_PARENT"),
        FORK_IN_ROOT = new String("FORK_IN_ROOT"),
        END = new String("END"),
        END_ON_LEFT = new String("END_ON_LEFT");

    export const useKey = function (key: string | Token, value: any) {
        return new UseKey(key.toString(), value);
    }

    export const
        node = function (
            val: string,
            map?: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any,
            useContent = false,
            mode = HOOK_MODE.RESOLVE
        ) {
            const node = new Node(val, map, useContent);
            node.mode = mode;
            return node;
        },
        key = function (val: string, map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) {
            return new Key(val, map);
        },
        pick = function (map?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) {
            return new Pick(map || function () { });
        },
        hook = function (fn: (env: IScanEnv, start: IPosition, end: IPosition, begin: IPosition) => void, mode = HOOK_MODE.RESOLVE) {
            return new Call(fn, mode);
        },
        pipe = function (pipe?: (token: any, env: IScanEnv, start: IPosition, end: IPosition) => any) {
            return new Pipe(pipe || function () { });
        },
        prev = function (match?: (token: Token | any, env: IScanEnv) => number | boolean, onlyToken?: boolean) {
            return new Prev(match, onlyToken);
        },
        merge = function (
            map: (tokens: Array<any>, env: IScanEnv, start: IPosition, end: IPosition) => any
                = function (tokens) { return tokens; }
        ) {
            return new Merge(map);
        };



    export const
        MATCH_BEGIN = "",
        MATCH_END = "",
        MATCH_EOF: IPattern = [["", ""]],
        MERGE_ALL_TOKENS = merge(
            function (tokens: Array<Token>) {
                return tokens.reduce((res, token) => res.concat(token));
            }
        ),
        UNFOLD = hook(function (env) {
            const { tokens, hookPoint } = env;
            for (const item of tokens.splice(hookPoint)) {
                if (item instanceof Array) {
                    tokens.push(...item);
                } else {
                    tokens.push(item);
                }
            }
        }, HOOK_MODE.RESOLVE);
}


namespace MARKS {
    export const
        FINISH = OPERATIONS.FINISH,
        END = OPERATIONS.END,
        END_ON_LEFT = OPERATIONS.END_ON_LEFT,
        UNWRAP = OPERATIONS.UNWRAP,
        WRAP = OPERATIONS.WRAP,
        ROOT = new String("ROOT");


    export const
        RESOLVE = "_RESOLVE_",
        TYPE = "_TYPE_",
        ROLL = "_ROLL_",
        PARENT = "_PARENT_",
        COLLECT = "_COLLECT_",
        BUBBING_HOOKS = "_BUBBING_HOOKS_",
        CAPTURING_HOOKS = "_CAPTURING_HOOKS_",
        SLICE_HOOKS = "_SLICE_HOOKS_",
        IGNORE_TESTS = "_IGNORE_TESTS_";



    export const RESOLVE_TYPE_SET: Set<String> = new Set([
        OPERATIONS.FINISH,
        OPERATIONS.END,
        OPERATIONS.END_ON_LEFT,
        OPERATIONS.UNWRAP,
        OPERATIONS.UNWRAP_ALL,
        OPERATIONS.WRAP,
        ROOT    // 只是个占位
    ]);
}

class Scanner {

    private scanTree: Record<string, any>;
    public useEscape = false;
    public useFold = true;
    public ignoreCase = false;
    constructor(
        pattern: IPattern,
        configure?: { useEscape?: boolean, useFold?: boolean, ignoreCase?: boolean }
    ) {
        this.scanTree = build(pattern);
        configure && Object.assign(this, configure);
    }

    scan(options: IScanEnv | string) {
        let env = typeof options === "string" ? {
            tokens: [],
            input: options,
            begin: 0,
            offset: 0,
            end: options.length,
            line: 1,
            column: 1,
            useFold: this.useFold,
            useEscape: this.useEscape,
            ignoreCase: this.ignoreCase,
            hookPoint: 0
        } : options;

        let matchPool: Array<[any, ISlices]> = [];
        let scopeStack: Array<IScope> = [[
            this.scanTree,
            getPosition(), getPosition(), getPosition(),
            0, false
        ]];
        let resolveState: IResolveState;
        let hasEscape = 0;
        let isBegin = true;


        let cpos: IPosition;
        while (true) {

            if (!hasEscape) {
                // 如果启用 useEscape 模式，字符捕获焦点从可能的 \ 号开始
                cpos = getPosition();
            }

            let char: string;

            if (!isBegin) {

                if (env.offset >= env.end) {

                    // 首个匹配符为 "" 则代表匹配每一轮的开始
                    // 当前面存在匹配符，后面出现的单独的 "" 匹配符则代表匹配输入内容的结束
                    // 如果仅匹配输入内容的结束，可以这样描述 : ["",""]

                    if (
                        scopeStack[0][SCOPE.CURSOR].offset < cpos.offset
                    ) {// 匹配扫描过程已结束
                        if (match("") || resolve()) {
                            return env;
                        }
                        if (env.offset < env.end) {
                            break;
                        }
                        matchPool.length = 0;
                        match("");
                    }
                    if (matchPool.length) {
                        const state = resolveState;
                        match("", true);
                        // 仅匹配 OPERATIONS.MATCH_EOF 的 ["",""] 
                        // 排除 OPERATIONS.MATCH_BEGIN OPERATIONS.MATCH_END 的 ""
                        if (state !== resolveState && resolve()) {
                            return env;
                        }
                    }
                    if (scopeStack[0][SCOPE.CURSOR].offset < cpos.offset) {
                        collect(scopeStack[0][SCOPE.CURSOR], cpos, null);
                    }
                    break;
                }

                char = env.input[env.offset];
                env.offset += 1;

                switch (char) {
                    case "\r":
                        if (env.input[env.offset] !== "\n") {
                            //env.column = 0;
                            break;
                        }
                        // 将 \r\n 归类为 \n 处理
                        char = "\n";
                        env.offset += 1;
                    case "\n":
                        env.line += 1;
                        env.column = 0;
                        break;
                }
                env.column += 1;
                env.ignoreCase && (char = char.toLowerCase());

                if (env.useEscape) {
                    if (char === "\\") {
                        hasEscape ^= 1;
                        if (hasEscape) {
                            continue;
                        }
                    } else if (hasEscape) {
                        hasEscape = 0;
                        char = "\\" + char;
                    }
                }
            } else {
                char = "";
                isBegin = false;
            }
            
            if (match(char)) {
                return env;
            }
        }

        return env;


        function getPosition(): IPosition {
            return { offset: env.offset, line: env.line, column: env.column }
        }

        function match(key: string, noResolve?: boolean) {
            const pool = matchPool;
            const scopeNode = scopeStack[0][SCOPE.NODE];

            matchPool = [];

            let node: any;
            let slices: ISlices;
            let hasBranch: boolean;
            let hasScopeNode = false;

            while (true) {
                if (pool.length) {
                    [node, slices] = pool.shift();
                } else if (!resolveState && !hasScopeNode) {
                    node = scopeNode;
                    slices = null;
                } else {
                    break;
                }
                hasScopeNode = hasScopeNode || (node === scopeNode);
                hasBranch = false;

                resolveState = walk(node, slices)
                    || node[MARKS.ROLL] && walk(node[MARKS.ROLL], slices)
                    || resolveState;
            }


            if (!noResolve && matchPool.length === 0 && resolve()) {
                return true;
            }

            function walk(parent: any, slices?: ISlices): IResolveState {
                let node = parent[key];
                if (!node) {
                    return;
                }
                if (!slices) {
                    slices = [[cpos, parent[MARKS.CAPTURING_HOOKS]]];
                } else if (hasBranch) {
                    slices = slices.slice();
                }
                hasBranch = true;

                matchPool.push([node, slices]);
                if (node[MARKS.CAPTURING_HOOKS]) {
                    slices.push([getPosition(), node[MARKS.CAPTURING_HOOKS]]);
                }

                if (!node[MARKS.RESOLVE]) {
                    return;
                } else {
                    node = node[MARKS.RESOLVE];
                }
                return [node, getPosition(), slices, scopeStack.length];

            }

        }



        function resolve() {
            if (!resolveState) {
                return;
            }

            const [node, { offset, line, column }, splits, stackSize] = resolveState;
            scopeStack.splice(0, scopeStack.length - stackSize);
            env.offset = offset;
            env.line = line;
            env.column = column;

            let backSteps = finallize(node, splits, true);
            if (backSteps > 0) {
                return true;
            }

            if (backSteps < 0) {
                do {
                    const scope = scopeStack.shift();
                    let tokens = env.tokens;
                    if (scope[SCOPE.USE_FOLD]) {
                        (env.tokens = tokens.shift()).pop();
                    } else {
                        tokens.length = scope[SCOPE.BACK_POINT];
                    }
                } while (++backSteps < 0)
            }
            //rollback(res);
            resolveState = null;
            isBegin = true;
        }

        function finallize(node: any, slices: ISlices, use_collect?: boolean): number {

            let type = node[MARKS.TYPE];

            const scope = scopeStack[0];
            const startPos = slices[0][0];
            let len = env.tokens.length;

            if (use_collect) {

                let hooks: Array<Hook>;
                let sliceHooks = node[MARKS.SLICE_HOOKS];
                if (sliceHooks) {
                    hooks = slices[0][1];
                    hooks && (hooks = hooks.filter(item => sliceHooks.has(item)));
                }
                collect(scope[SCOPE.CURSOR], startPos, hooks);
            }

            if (type === MARKS.WRAP) {
                return wrap(node, slices, use_collect);
            }

            const hookPoint = env.tokens.length;

            if (use_collect && type !== MARKS.END_ON_LEFT) {
                let res = collectSlices(slices, node[MARKS.SLICE_HOOKS]);
                if (res < 0) {
                    env.tokens.length = len;
                    return res + 1;
                }
            }
            env.hookPoint = hookPoint;

            if (type === MARKS.UNWRAP) {
                return unwrap(node, slices);
            } else {
                const cursorPos = getPosition();
                const res = useHook(node[MARKS.BUBBING_HOOKS], startPos, cursorPos);
                if (res < 0) {
                    env.tokens.length = len;
                    return res + 1;
                }
                if (type !== MARKS.END_ON_LEFT) {
                    scope[SCOPE.CURSOR] = cursorPos;
                } else {
                    env.offset = startPos.offset;
                    env.line = startPos.line;
                    env.column = startPos.column;
                    scope[SCOPE.CURSOR] = startPos;
                    return 1;
                }
                return type !== MARKS.END ? res : 1;
            }

        }


        function wrap(node: any, slices: ISlices, use_collect?: boolean) {
            const { useFold, tokens } = env;
            const backPoint = tokens.length;
            const startPos = slices[0][0];
            const beginPos = getPosition();
            const cursorPos = getPosition();
            scopeStack.unshift([
                node,
                startPos, beginPos, cursorPos,
                backPoint, useFold
            ]);

            if (useFold) {
                env.tokens = [tokens];
                env.hookPoint = 1;
            }


            let backSteps = use_collect ? collectSlices(
                slices,
                node[MARKS.SLICE_HOOKS]
            ) : 0;

            if (backSteps >= 0) {
                backSteps = useHook(node[MARKS.BUBBING_HOOKS], startPos, cursorPos, beginPos);
                if (backSteps >= 0) {
                    node = node[MARKS.RESOLVE];
                    return node ? finallize(node, slices, false) : backSteps;
                }
            }
            return backSteps;
        }


        function unwrap(node: any, slices: ISlices) {

            const scope = scopeStack.shift();

            if (scope[SCOPE.USE_FOLD]) {
                let tokens = env.tokens.shift()
                env.hookPoint = tokens.length;
                tokens.push(env.tokens);
                env.tokens = tokens;
            }

            let backSteps = useHook(
                node[MARKS.BUBBING_HOOKS],
                scope[SCOPE.START],
                getPosition(),
                scope[SCOPE.BEGIN],
            );
            if (backSteps >= 0) {
                node = node[MARKS.RESOLVE];

                scopeStack[0][SCOPE.CURSOR] = getPosition();
                if (node) {
                    backSteps = finallize(node, slices, false);
                    if (backSteps >= 0) {
                        return backSteps;
                    }
                } else {
                    return backSteps;
                }
            }
            scopeStack.unshift(scope);
            if (scope[SCOPE.USE_FOLD]) {
                let tokens = env.tokens.pop();

                tokens.unshift(env.tokens);
                env.tokens = tokens;
            }
            return backSteps + 1;
        }

        function useHook(hooks: Array<Hook>, start: IPosition, end: IPosition, begin?: IPosition): number {
            for (const hook of hooks) {
                let res = hook.use(env, start, end, begin);
                if (res < 0) {
                    return res;
                }
            }
            return 0;
        }

        function collect(start: IPosition, end: IPosition, hooks: Array<Hook>) {
            let res: any = 0;
            if (start.offset < end.offset) {
                let { tokens } = env;
                env.hookPoint = tokens.length;
                tokens.push(
                    new Token(
                        env.input.slice(start.offset, end.offset),
                        start,
                        end
                    )
                );
                if (hooks) {
                    res = useHook(hooks, start, end);
                }
            }
            return res;
        }

        function collectSlices(
            slices: ISlices,
            sliceHooks: Set<Hook>
        ) {
            let cursor = slices[0][0];
            if (sliceHooks) {
                for (let i = 1; i < slices.length; i += 1) {
                    let [next, hooks] = slices[i];
                    hooks = hooks.filter(item => sliceHooks.has(item));
                    if (hooks.length) {
                        const res = collect(cursor, next, hooks);
                        if (res < 0) {
                            return res;
                        }
                        cursor = next;
                    }
                }
            }
            return collect(cursor, getPosition(), null);
        }
    }
}


class Token {

    loc: ISourceLocation;

    constructor(public value: string, start: IPosition, end: IPosition) {
        this.loc = { start, end };
    }
    trim() {
        const found = this.value.match(/^\s*|\s*$/gm);
        return this.slice(found[0].length, this.value.length - found[1].length);
    }
    concat(token: Token) {
        return new Token(this.value + token.value, this.loc.start, token.loc.end);
    }
    slice(beginIndex: number, endIndex = this.value.length) {
        let { value, loc: { start, end } } = this;
        let { offset, line, column } = start;
        let index = 0;

        if (endIndex < 0) {
            endIndex = value.length + endIndex;
        }
        if (beginIndex < 0) {
            beginIndex = value.length + beginIndex;
        }
        if (beginIndex > endIndex) {
            endIndex = beginIndex;
        }
        const range = [beginIndex, endIndex].map(
            function (limit): IPosition {
                if (limit === 0) {
                    return start;
                }
                if (limit === value.length) {
                    return end;
                }
                while (index < limit) {
                    if (value[index] === "\n") {
                        line += 1;
                        column = 1;
                    } else {
                        column += 1;
                    }
                    index += 1;
                }
                return { offset: offset + limit, line, column }
            }
        )
        return new Token(value.slice(beginIndex, endIndex), range[0], range[1]);
    }
    toString() {
        return this.value;
    }
}




type HookStack = Array<Hook | HookStack | RootStack>;
type HookList = Array<Hook>;

class RootStack extends Array<Hook | HookStack> { }

type BubbleTable = Array<HookStack>;
type CaptureTable = Array<HookList>;
type BuildResult = [Array<any>, BubbleTable, CaptureTable];

function build(pattern: IPattern): Record<string, any> {
    const matchTree = { [MARKS.TYPE]: MARKS.ROOT };
    const [nodes, bubbling_map, capturing_map] = buildRule(
        [pattern],
        [matchTree],
        [[new RootStack()]],
        [[]],
        [matchTree]
    );
    for (let i = 0; i < nodes.length; i += 1) {
        // 被省去 MARKS.FINISH 的描述自动补全
        const node = nodes[i];
        if (!MARKS.RESOLVE_TYPE_SET.has(node[MARKS.TYPE])) {
            buildKey(MARKS.FINISH, [node], [bubbling_map[i]], [capturing_map[i]]);
        }
    }
    return matchTree;
}


function buildRule(
    patterns: Array<IPattern>,
    nodes: Array<any>,
    bubbleTable: BubbleTable,
    captureTable: CaptureTable,
    scopeChain: Array<any>
): BuildResult {

    const rsRule: Array<IPattern> = [];
    let index = 0;
    let key: IPattern;
    while (index < patterns.length) {
        let ndepth = 0, begin = index;
        const forkChain: Array<number | String> = [];

        while (true) {
            if (patterns[index] === OPERATIONS.FORK_IN_ROOT) {
                if (ndepth) {
                    forkChain.push(ndepth);
                    ndepth = 0;
                }
                forkChain.push(OPERATIONS.FORK_IN_ROOT);
            } else if (patterns[index] === OPERATIONS.FORK_IN_PARENT) {
                ndepth += 1;
            } else {
                break;
            }
            index += 1;
        }

        if (index !== begin) {
            ndepth && forkChain.push(ndepth);

            for (let node of nodes) {
                let parent: any = node;
                let cursor = 0;
                for (let d of forkChain) {
                    if (d === OPERATIONS.FORK_IN_ROOT) {
                        parent = scopeChain[cursor++];
                    } else {
                        do {
                            parent = parent[MARKS.PARENT];
                            if (parent === scopeChain[cursor]) {
                                cursor += 1;
                            }
                        } while (--(<number>d) > 0)
                    }
                }
                if (node[MARKS.ROLL] !== parent) {
                    if (node[MARKS.ROLL]) {
                        debugger;   // 暂不支持一个匹配路径存在多个 FORK 匹配（用不到）
                    }
                    node[MARKS.ROLL] = parent;
                }
            }
            continue;
        }

        switch (key = patterns[index]) {
            case OPERATIONS.NO_CAPTURE:
            case OPERATIONS.NO_COLLECT:
                rsRule.push(key);
            case OPERATIONS.SPLIT:
                setHook(null);
                break;

            case OPERATIONS.OPTION:
                return walk(
                    [
                        rsRule.concat(patterns.slice(index + 1)),
                        rsRule.concat(patterns.slice(index + 2))
                    ],
                    function (pattern) {
                        return buildRule(
                            pattern,
                            nodes,
                            bubbleTable.map(hooks => hooks.slice()),
                            captureTable.map(maps => maps.slice()),
                            scopeChain
                        )
                    }
                );

            case OPERATIONS.MARK_AS_ROOT:
                patterns = rsRule.concat(patterns.slice(index + 1));
                return walk(nodes, function (node, index) {
                    const bubbleHooks = bubbleTable[index];
                    return buildRule(
                        patterns,
                        [node],
                        [[new RootStack(...<HookStack>bubbleHooks[0])].concat(bubbleHooks.slice(1))],
                        [captureTable[index]],
                        [node].concat(scopeChain)
                    )
                });
            default:
                if (key instanceof Hook) {
                    setHook(key);
                } else {
                    if (key instanceof Array) {
                        [nodes, bubbleTable, captureTable] = walk(key, function (item) {
                            return (item instanceof Array ? buildRule : buildKey)(
                                item, nodes,
                                bubbleTable.map(hooks => hooks.slice()),
                                captureTable.map(maps => maps.slice()),
                                scopeChain
                            )
                        })
                    } else {
                        [nodes, bubbleTable, captureTable] = buildKey(key, nodes, bubbleTable, captureTable);
                    }
                    while (rsRule.length) {
                        setHook(
                            rsRule.shift() === OPERATIONS.NO_COLLECT
                                ? OPERATIONS.pipe()
                                : new NoCapture()
                        );
                    }
                }
                break;
        }

        index += 1;
    }

    return [nodes, bubbleTable, captureTable];


    function walk(
        list: Array<any>,
        next: (item: any, index: number) => BuildResult
    ): BuildResult {

        let newNodes: Array<any> = [];
        let newBubbleTable: Array<HookStack> = [];
        let newCaptureTable: Array<any[]> = [];

        for (let i = 0; i < list.length; i += 1) {
            const res = next(list[i], i);
            newNodes = newNodes.concat(res[0]);
            newBubbleTable = newBubbleTable.concat(res[1]);
            newCaptureTable = newCaptureTable.concat(res[2]);
        }


        return [newNodes, newBubbleTable, newCaptureTable];

    }
    function setHook(hook: Hook) {

        if (!hook) {
            hook = new Call(function () { }, HOOK_MODE.CAPTURE);
            for (let i = 0; i < nodes.length; i += 1) {
                MARKS.RESOLVE_TYPE_SET.has(nodes[i][MARKS.TYPE]) || addHook(i);
            }
            return;
        }
        switch (hook.mode) {
            case HOOK_MODE.RESOLVE:
                bubbleTable.forEach(hooks => hooks.push(<Hook>key));
                break;
            case HOOK_MODE.PIPE:
            case HOOK_MODE.CAPTURE:
                for (let i = 0; i < nodes.length; i += 1) {
                    addHook(i);
                }
                break;
        }
        function addHook(index: number) {
            const node = nodes[index];
            const type = node[MARKS.TYPE];
            // 实际使用中不会刻意用到共用钩子的情况，统一使之不共用可降低声明成本和更符合声明直觉
            const h = Object.create(hook);
            if (hook.mode !== HOOK_MODE.PIPE && MARKS.RESOLVE_TYPE_SET.has(type)) {
                node[MARKS.BUBBING_HOOKS].push(h);
            } else {
                (
                    node[MARKS.CAPTURING_HOOKS]
                    || (node[MARKS.CAPTURING_HOOKS] = [])
                ).push(h);
                captureTable[index].push(h);
            }
        }
    }
}


function buildKey(
    key: any,
    nodes: Array<any>,
    bubbleTable: BubbleTable,
    captureTable: CaptureTable,
    scopeChain?: Array<any>
): BuildResult {
    if (typeof key === "string") {
        if (/^[\s\S]?$/.test(key)) {
            key = [key];
        }
        for (let i = 0; i < key.length; i += 1) {
            nodes = nodes.map(function (node) {
                return node[key[i]] || (node[key[i]] = { [MARKS.PARENT]: node });
            });
        }
    } else if (MARKS.RESOLVE_TYPE_SET.has(key)) {

        nodes = nodes.map(function (node, i) {

            let bubbleHooks: HookStack = bubbleTable[i];
            let captureHooks = captureTable[i];
            captureTable[i] = [];

            if (key === OPERATIONS.UNWRAP_ALL) {
                key = OPERATIONS.UNWRAP;
                if (!(bubbleHooks[0] instanceof RootStack)) {
                    if (bubbleHooks.length > 1) {
                        bubbleHooks[0] = (<HookStack>bubbleHooks[0]).concat(bubbleHooks.slice(1));
                    }
                    do {
                        bubbleTable[i] = [bubbleHooks[0][0]];
                        bubbleHooks = <HookStack>bubbleHooks[0];

                        node = getResolveNode(node, key, bubbleHooks, captureHooks);
                    } while (!(bubbleHooks[0] instanceof RootStack))
                }
            } else {
                if (key === OPERATIONS.UNWRAP) {
                    bubbleTable[i] = [bubbleHooks[0][0]];
                    bubbleHooks = (<HookStack>bubbleHooks[0]).concat(bubbleHooks.slice(1));
                } else if (key === OPERATIONS.WRAP) {
                    bubbleTable[i] = [bubbleHooks];
                    bubbleHooks = [];
                } else {
                    bubbleTable[i] = [bubbleHooks[0]];
                }

                node = getResolveNode(node, key, bubbleHooks, captureHooks);

            }
            return node;
        });

    } else {
        debugger;
    }
    return [nodes, bubbleTable, captureTable];

    function getResolveNode(
        node: any, type: string,
        bubbleHooks: HookStack, sliceHooks: HookList
    ) {
        if (node[MARKS.RESOLVE]) {
            // 如果存在重复定义的 pattern 则这里会执行
            debugger;
        }
        return node[MARKS.RESOLVE] = {
            [MARKS.PARENT]: node,
            [MARKS.TYPE]: type,
            [MARKS.SLICE_HOOKS]: sliceHooks.length
                ? new Set(sliceHooks.splice(0))
                : null,
            [MARKS.BUBBING_HOOKS]: bubbleHooks.slice(1).reverse()
        };
    }

}

function unwrapTokens(tokens: any) {
    if (tokens instanceof Token) {
        return tokens.value;
    }
    if (tokens instanceof Array) {
        return tokens.map(unwrapTokens);
    }
    return tokens;
}