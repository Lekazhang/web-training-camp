const EOF = Symbol("EOF"); //利用symbol的唯一性创造一个字符
// const css = require('css')//引入css包
let isTag = /^[a-zA-Z]$/; //包含小写字母或者大写字母
let currentToken = null;

function data(c) {
  //第一个进入的判断
  if (c == "<") {
    //首先判断是不是一个标签,也就是判断一个字符是不是<
    return tagOpen;
  } else if (c == EOF) {
    emit({
      type: "EOF",
    });
    return;
  } else {
    emit({
      type: "text",
      content: c, //文本节点里的一个字符
    });
    return data; //文本节点
  }
}

function tagOpen(c) {
  if (c == "/") {
    //首先判断是不是一个结束标签
    return endTagOpen;
  } else if (c.match(isTag)) {
    //进到这一步可以认为传进的标签是一个开始标签或者自封闭标签
    currentToken = {
      type: "startTag",
      tagName: "",
    };
    return tagName(c);
  } else {
    emit({
      type: "text",
      content: c, //文本节点里的一个字符
    });
    return;
  }
}

function endTagOpen(c) {
  if (c.match(isTag)) {
    currentToken = {
      type: "endTag",
      tagName: "",
    };
    return tagName(c);
  } else if (c == ">") {
  } else if (c == EOF) {
  } else {
  }
}

function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    //遇到空格等状态时，说明后面跟这1为属性
    return beforeAttributeName;
  } else if (c == "/") {
    //这是说明是自封闭标签
    return selfClosingStartTag;
  } else if (c.match(isTag)) {
    //如果是字母贼追加到tagName上
    currentToken.tagName += c;
    return tagName;
  } else if (c == ">") {
    //结束标签回到下一个状态
    emit(currentToken);
    return data;
  } else {
    currentToken += c;
    return tagName;
  }
}

function afterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == "=") {
    return beforeAttributeValue;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == COF) {
  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}

function beforeAttributeName(c) {
  //这里是除了属性的开始
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == ">" || c == "/" || c == EOF) {
    return afterAttributeName(c);
  } else if (c == "=") {
  } else {
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}

function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c == ">" || c == "/" || c == EOF) {
    return afterAttributeName(c);
  } else if (c == "=") {
    return beforeAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == '"' || c == "'" || c == "<") {
  } else {
    currentAttribute.name += c;
    return attributeName;
  }
}

function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c == ">" || c == "/" || c == EOF) {
    return beforeAttributeValue;
  } else if (c == '"') {
    return doubleQuotedAttributeValue;
  } else if (c == "'") {
    return singleQuotedAttributeValue;
  } else if (c == ">") {
  } else {
    return UnquotedAttributeValue(c);
  }
}
//只找双引号结束
function doubleQuotedAttributeValue(c) {
  if (c == '"') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}
//只找单引号结束
function singleQuotedAttributeValue(c) {
  if (c == "'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return singleQuotedAttributeValue;
  }
}
//只找空白符结束
function UnquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  } else if (c == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == "\u0000") {
  } else if (c == '"' || c == "'" || c == "<" || c == "=" || c == "`") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return UnquotedAttributeValue;
  }
}

function afterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value; //写到当前标签的token上
    emit(currentToken);
    return data;
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function selfClosingStartTag(c) {
  if (c == ">") {
    currentToken.isSelfClosing = true;
    return data;
  } else if (c == "EOF") {
  } else {
  }
}

//这里我们把css规则暂存到一个数组里
/**
 * css设计会尽量保证所有选择器
 * 都能在startTag进入的时候就能够被判断
 */
let rules = []; //保存收集到的css规则
function addCSSRules(text) {
  // let ast = css.parse(text)
  console.log(JSON.stringify(ast, null, "    "));
  rules.push(...ast.stylesheet.rules);
}
/**
 *
 * @param {*} element
 * @param {*} selector
 * @returns
 *
 * selector代表简单选择器 .a #a a，暂时仅限这三种
 * 。
 */
function match(element, selector) {
  let attr = [];
  if (!selector || !element.attributes) {
    return false;
  } else {
    attr = element.attributes.filter((attr) => attr.name === "id")[0];
  }
  if (selector.charAt(0) == "#") {
    if (attr && attr.value === selector.replace("#", "")) {
      return true;
    }
  } else if (selector.charAt(0) == ".") {
    if (attr && attr.value === selector.replace(".", "")) {
      return true;
    }
  } else {
    if (element.tagName === selector) {
      return true;
    }
  }
  return false;
}

//处理可以匹配到的标签
function computeCSS(element) {
  let elements = stack.slice().reverse(); //获取父元素的序列，stack里面存储的所有元素的父元素，先复制在反转

  if (!element.computedStyle) {
    element.computedStyle = {};
  }

  for (let rule of rules) {
    let selectorParts = rule.selectors[0].split(" ").reverse();
    if (!match(element, selectorParts[0])) {
      continue;
    }
    //只有和样式表有匹配时才能进到这里

    let matched = false;
    //循环双元素选择器来找到他们是否能匹配
    let j = 1;
    for (let i = 0; i < elements.length; i++) {
      if (match(elements[i], selectorParts[j])) {
        j += 1;
      }
      //判断不用循环时跳出
      if (!selectorParts[j]) {
        break;
      }
    }
    if (j >= selectorParts.length) {
      matched = true;
    }
    if (matched) {
      let sp = specificity(rule.selectors[0]);
      //如果匹配到
      let computedStyle = element.computedStyle;
      for (const declaration of rule.declarations) {
        if (!computedStyle[declaration.property]) {
          computedStyle[declaration.property] = {};
        }
        if (!computedStyle[declaration.property].specificity) {
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        } else if (
          compare(computedStyle[declaration.property].specificity, sp) < 0
        ) {
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        }
      }
      //↑↑↑↑↑↑↑应用规则到元素上的逻辑
      console.log(element.computedStyle);
    }
  }
}
//根据style标签里的元素进行权重赋值
function specificity(selector) {
  let p = [0, 0, 0, 0];
  let selectorParts = selector.split(" ");
  for (const part of selectorParts) {
    if (part.charAt(0) == "#") {
      p[1] += 1;
    } else if (part.charAt(0) == ".") {
      p[2] += 1;
    } else {
      p[3] += 1;
    }
  }
  return p;
}
//权重的比较
function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) {
    return sp1[0] - sp2[0];
  }
  if (sp1[1] - sp2[1]) {
    return sp1[1] - sp2[1];
  }
  if (sp1[2] - sp2[2]) {
    return sp1[2] - sp2[2];
  }
  return sp1[3] - sp2[3];
}

let stack = [{ type: "document", children: [] }];
let currentTextNode = null;
function emit(token) {
  /**
   * 因为在状态机创建完token后在同一出口进行输出
   */
  let top = stack[stack.length - 1];
  if (token.type == "startTag") {
    //进行入栈
    let element = {
      //入栈一个element，startTage和endTag对应同一个element
      type: "element",
      children: [],
      attributes: [],
    };

    element.tagName = token.tagName; //令token的tagname变为element的tagname

    for (let p in token) {
      if (p != "type" && p != "tagName") {
        element.attributes.push({
          name: p,
          value: token[p],
        });
      }
    }
    //这一段处理在进入statag时所碰到的，可以匹配到的css  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    computeCSS(element);
    //这一段处理在进入statag时所碰到的，可以匹配到的css↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    top.children.push(element);
    element.parent = top; //对偶操作

    if (!token.isSelfClosing) {
      //判断不是自封闭的才push
      stack.push(element);
    }
    currentTextNode = null;
  } else if (token.type == "endTag") {
    if (top.tagName != token.tagName) {
      throw new Error("Tag start end dosen't match");
    } else {
      // 遇到style标签时，执行添加css规则的操作
      if (top.tagName === "style") {
        /**
         * top:style标签
         * children[0]:文本节点
         * content：标签内容
         */
        addCSSRules(top.children[0].content);
      }

      stack.pop();
    }
    currentTextNode = null;
  } else if (token.type == "text") {
    if (currentTextNode == null) {
      currentTextNode = {
        type: "text",
        content: "",
      };
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
  console.log(token);
}
module.exports.parseHTML = function parseHTML(html) {
  let state = data; //初始状态，在html里的初始状态也是data
  for (let c of html) {
    //循环html调用状态机的操作
    state = state(c);
  }
  state = state(EOF); //为了避免有的情况下没有结束状态，所以这里可以自己设立一个唯一性的字符做结束，
  console.log(stack[0]);
  return stack[0];
};
