// mvvm入口函数  用于整合 数据监听器_observer、 指令解析器_compile、连接Observer和Compile的_watcherTpl
function myVue(options = {}) {
  // 防止没传，设一个默认值
  this.$options = options // 配置挂载
  this.$el = document.querySelector(options.el) // 获取dom
  this._data = options.data // 数据挂载
  this._watcherTpl = {} // watcher池
  this._observer(this._data) // 传入数据，执行函数，重写数据的get set
  this._compile(this.$el) // 传入dom，执行函数，编译模板 发布订阅
}

// 重写data 的 get set  更改数据的时候，触发watch 更新视图
myVue.prototype._observer = function(obj, keyName) {
  var _this = this
  //   var _watcherTpl
  //   if (this._observerCount) {
  //     _watcherTpl = this._watcherTpl[obj]
  //   } else {
  //     _watcherTpl = this._watcherTpl
  //   }

  Object.keys(obj).forEach(key => {
    // 遍历数据
    var value = obj[key] // 获取属性值
    if (Object.prototype.toString.call(value) === '[object Object]') {
      _this._watcherTpl[key] = {}
      _this._observer(value, key)
    } else {
      if (keyName) {
        _this._watcherTpl[keyName][key] = {
          // 每个数据的订阅池()
          _directives: []
        }
      } else {
        _this._watcherTpl[key] = {
          // 每个数据的订阅池()
          _directives: []
        }
      }

      var watcherTpl = keyName ? _this._watcherTpl[keyName][key] : _this._watcherTpl[key] // 数据的订阅池
      Object.defineProperty(obj, key, {
        // 双向绑定最重要的部分 重写数据的set get
        configurable: true, // 可以删除
        enumerable: true, // 可以遍历
        get() {
          console.log(`${key}获取值：${value}`)
          return value // 获取值的时候 直接返回
        },
        set(newVal) {
          // 改变值的时候 触发set
          console.log(`${key}更新：${newVal}`)
          if (value !== newVal) {
            value = newVal
            watcherTpl._directives.forEach(item => {
              // 遍历订阅池
              item.update()
              // 遍历所有订阅的地方(v-model+v-bind+{{}}) 触发this._compile()中发布的订阅Watcher 更新视图
            })
          }
        }
      })
    }
  })
}

// 模板编译
myVue.prototype._compile = function(el) {
  var _this = this,
    nodes = el.children // 获取app的dom
  for (let i = 0, len = nodes.length; i < len; i++) {
    // 遍历dom节点
    let node = nodes[i]
    if (node.children.length) {
      _this._compile(node) // 递归深度遍历 dom树
    }

    // 如果有v-model属性，并且元素是INPUT或者TEXTAREA，我们监听它的input事件
    if (node.hasAttribute('v-model') && (node.tagName = 'INPUT' || node.tagName == 'TEXTAREA')) {
      node.addEventListener(
        'input',
        (function() {
          var attVal = node.getAttribute('v-model') // 获取v-model绑定的值
          var currentWatchObj,
            cuurentData,
            key = attrVal
          if (attVal.indexOf('.') !== -1) {
            var p1 = attVal.split('.')[0]
            var p2 = attVal.split('.')[1]
            key = p2
            currentWatchObj = _this._watcherTpl[p1][p2]
            cuurentData = _this._data[p1]
          } else {
            currentWatchObj = _this._watcherTpl[attrVal]
            cuurentData = _this._data
          }
          currentWatchObj._directives.push(
            new Watcher(node, _this, attVal, 'value') // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
          )
          return function() {
            cuurentData[key] = node.value // input值改变的时候 将新值赋给数据 触发set=>set触发watch 更新视图
          }
        })()
      )
    }

    if (node.hasAttribute('v-bind')) {
      // v-bind指令
      var attrVal = node.getAttribute('v-bind') // 绑定的data
      attrVal.indexOf('.') !== -1
        ? _this._watcherTpl[attrVal.split('.')[0]][attrVal.split('.')[1]]._directives.push(
            new Watcher(node, _this, attrVal, 'innerHTML') // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
          )
        : _this._watcherTpl[attrVal]._directives.push(
            new Watcher(node, _this, attrVal, 'innerHTML') // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
          )
    }

    var reg = /\{\{\s*([^}]+\S)\s*\}\}/g,
      txt = node.textContent // 正则匹配{{}}
    if (reg.test(txt)) {
      node.textContent = txt.replace(reg, (matched, placeholder) => {
        // matched匹配的文本节点包括{{}}, placeholder 是{{}}中间的属性名
        var getName = _this._watcherTpl // 所有绑定watch的数据
        getName = placeholder.indexOf('.') !== -1 ? getName[placeholder.split('.')[0]][placeholder.split('.')[1]] : getName[placeholder] // 获取对应watch 数据的值
        if (!getName._directives) {
          // 没有事件池 创建事件池
          getName._directives = []
        }
        getName._directives.push(
          new Watcher(node, _this, placeholder, 'innerHTML') // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
        )

        return placeholder.split('.').reduce((val, key) => {
          return _this._data[key] // 获取数据的值 触发get 返回当前值
        }, _this.$el)
      })
    }
  }
}

// new Watcher() 为this._compile()发布订阅+ 在this._observer()中set(赋值)的时候更新视图
function Watcher(el, vm, val, attr) {
  this.el = el // 指令对应的DOM元素
  this.vm = vm // myVue实例
  this.val = val // 指令对应的值
  this.attr = attr // dom获取值，如value获取input的值 / innerHTML获取dom的值
  this.update() // 更新视图
}
Watcher.prototype.update = function() {
  this.el[this.attr] = this.val.indexOf('.') !== -1 ? this.vm._data[this.val.split('.')[0]][this.val.split('.')[1]] : this.vm._data[this.val] // 获取data的最新值 赋值给dom 更新视图
}
