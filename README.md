# astry

可作为任意编程语言的分词器或其它作用的粗粒度分析器，或者低复杂度编程语言的语法分析器(存在 结合律 优先级 上下文 概念的编程语言需要使用类似 [Dison](https://github.com/FEFF01/Dison) 的 AST 分析器才完备)


> `npm install astry` -> `npm i && npm run dev` -> `http://localhost:8080/` -> `F12`

> [Test demo](https://feff01.github.io/astry/dist/)

#### 利用 `astry` 构造 `AST Parser` 的简单例子：
>* [json-grammar.ts](./js/json-grammar.ts)
>* [css-grammar.ts](./js/css-grammar.ts)
>* [html-grammar.ts](./js/html-grammar.ts)



### 功能注释
```javascript
import {
    Scanner, OPERATIONS, HOOK_MODE, IScanEnv,
    IPattern, Token,
    IPosition, ISourceLocation,
    UseKey
} from "astry"

const {
    FINISH, // 匹配一个字段的结束（每一条匹配路径，如果最终没有这个标记会在构造时自动添加）
    WRAP,   // 包裹当前及后续 UNWRAP 之内的匹配结果，如果使用 useFold（默认） 模式其中内容将会被包裹进一个数组内
    UNWRAP, // 解除包裹
    UNWRAP_ALL, // 当当前匹配节点被多级包裹时将解除包裹至根节点或者 MARK_AS_ROOT 标记的节点
    OPTION, // 后续跟随的一个匹配片段将是可选的（类似正则里的?）
    SPLIT,  // 将结果从当前位置切割
    NO_COLLECT, // 后续跟随的一个匹配片段将不会被收集
    NO_CAPTURE, // 后续跟随的一个匹配片段不被包含进结果内
    MARK_AS_ROOT,   // 将当前节点视作为后续节点的根节点
    FORK_IN_PARENT, // 当前节点后续匹配节点可以为上层节点
    FORK_IN_ROOT,   // 当前节点的后续匹配节点可以为根节点
    END,    // 匹配当这里结束
    END_ON_LEFT,    // 匹配到当前匹配结果的左侧结束

    useKey, // 获得 UseKey 对象的实例
    node,   // 将下一个当前层级的匹配结果视作为一个对象节点收集（有基本的 type loc 属性和使用 UseKey 标记的各种属性） 
    key,    // 将下一个前层级的匹配结果视作为 node 节点的一个 key 标记
    pick,   // 处理下一个当前层级的匹配结果（和 pipe 的结合方向相反）
    hook,   // 可以根据 HOOK_MODE 参数指定钩子方法回调模式
    pipe,   // 处理上一个当前层级的匹配结果，如果不存在上一个同层级匹配节点，则是处理当前匹配结果之前的未被匹配内容
    prev,   // 将符合规则的上一个节点或者上一个节点的部分内容归结为当前节点内容
    merge   // 将当前匹配过程中可能存在的prev 操作产生的多个匹配结果合并
} = OPERATIONS;
```


