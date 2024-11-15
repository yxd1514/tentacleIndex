(function (window) {
  var ctx, // Canvas的上下文，用来进行绘制
    hue, // 用于控制颜色变化的振荡器
    logo, // logo图像
    form, // 表单，用于提交生成的图像
    buffer, // 用于缓存绘制内容的canvas
    target = {}, // 目标位置（鼠标或触摸点的位置）
    tendrils = [], // 画出的触须数组
    settings = {}; // 配置项

  // 配置项初始化
  settings.debug = true; // 是否开启调试模式
  settings.friction = 0.5; // 摩擦力
  settings.trails = 50; // 触须的数量
  settings.size = 50; // 触须节点的数量
  settings.dampening = 0.25; // 阻尼系数
  settings.tension = 0.98; // 弹簧张力

  Math.TWO_PI = Math.PI * 2; // 定义2π常量

  // ========================================================================================
  // 振荡器（用于生成动态的数值）
  // ----------------------------------------------------------------------------------------

  // 振荡器构造函数
  function Oscillator(options) {
    this.init(options || {});
  }

  // 振荡器原型链
  Oscillator.prototype = (function () {
    var value = 0;

    return {
      // 初始化振荡器的参数
      init: function (options) {
        this.phase = options.phase || 0; // 初始相位
        this.offset = options.offset || 0; // 初始偏移量
        this.frequency = options.frequency || 0.001; // 振荡频率
        this.amplitude = options.amplitude || 1; // 振幅
      },

      // 更新振荡器的相位并返回新的值
      update: function () {
        this.phase += this.frequency;
        value = this.offset + Math.sin(this.phase) * this.amplitude;
        return value;
      },

      // 获取当前的振荡值
      value: function () {
        return value;
      },
    };
  })();

  // ========================================================================================
  // 触须（代表由多个节点组成的弹簧链条）
  // ----------------------------------------------------------------------------------------

  function Tendril(options) {
    this.init(options || {});
  }

  Tendril.prototype = (function () {
    // 定义每个触须的节点（Node）
    function Node() {
      this.x = 0; // 节点的X坐标
      this.y = 0; // 节点的Y坐标
      this.vy = 0; // 节点的Y方向速度
      this.vx = 0; // 节点的X方向速度
    }

    return {
      // 初始化触须
      init: function (options) {
        this.spring = options.spring + Math.random() * 0.1 - 0.05; // 弹簧系数，带有随机扰动
        this.friction = settings.friction + Math.random() * 0.01 - 0.005; // 摩擦力，带有随机扰动
        this.nodes = []; // 存储触须节点

        // 初始化触须的每个节点
        for (var i = 0, node; i < settings.size; i++) {
          node = new Node();
          node.x = target.x; // 节点的初始位置为目标位置
          node.y = target.y;
          this.nodes.push(node); // 将节点添加到触须中
        }
      },

      // 更新触须的状态
      update: function () {
        var spring = this.spring, // 弹簧系数
          node = this.nodes[0]; // 获取触须的第一个节点

        // 弹簧作用，节点会朝着目标位置移动
        node.vx += (target.x - node.x) * spring;
        node.vy += (target.y - node.y) * spring;

        // 更新触须中每个节点的位置和速度
        for (var prev, i = 0, n = this.nodes.length; i < n; i++) {
          node = this.nodes[i];

          if (i > 0) {
            prev = this.nodes[i - 1]; // 获取前一个节点

            // 触须节点之间的弹簧作用
            node.vx += (prev.x - node.x) * spring;
            node.vy += (prev.y - node.y) * spring;
            node.vx += prev.vx * settings.dampening; // 阻尼作用
            node.vy += prev.vy * settings.dampening;
          }

          // 更新节点的速度，施加摩擦力
          node.vx *= this.friction;
          node.vy *= this.friction;

          // 更新节点的位置
          node.x += node.vx;
          node.y += node.vy;

          // 弹簧系数逐渐减小
          spring *= settings.tension;
        }
      },

      // 绘制触须
      draw: function () {
        var x = this.nodes[0].x,
          y = this.nodes[0].y,
          a,
          b;

        ctx.beginPath(); // 开始绘制路径
        ctx.moveTo(x, y); // 移动到第一个节点的位置

        // 使用二次贝塞尔曲线绘制触须的路径
        for (var i = 1, n = this.nodes.length - 2; i < n; i++) {
          a = this.nodes[i];
          b = this.nodes[i + 1];
          x = (a.x + b.x) * 0.5; // 计算中点
          y = (a.y + b.y) * 0.5;

          ctx.quadraticCurveTo(a.x, a.y, x, y); // 绘制二次贝塞尔曲线
        }

        a = this.nodes[i];
        b = this.nodes[i + 1];

        ctx.quadraticCurveTo(a.x, a.y, b.x, b.y); // 绘制最后一段曲线
        ctx.stroke(); // 描边路径
        ctx.closePath(); // 关闭路径
      },
    };
  })();

  // ----------------------------------------------------------------------------------------

  // 初始化函数
  function init(event) {
    document.removeEventListener("mousemove", init); // 移除初次绑定的事件
    document.removeEventListener("touchstart", init);

    document.addEventListener("mousemove", mousemove); // 绑定鼠标移动事件
    document.addEventListener("touchmove", mousemove); // 绑定触摸移动事件
    document.addEventListener("touchstart", touchstart); // 绑定触摸开始事件

    mousemove(event); // 初始化鼠标位置
    reset(); // 重置触须
    loop(); // 启动动画循环
  }

  // 重置触须数组
  function reset() {
    tendrils = [];
    for (var i = 0; i < settings.trails; i++) {
      tendrils.push(
        new Tendril({
          spring: 0.45 + 0.025 * (i / settings.trails), // 弹簧系数随着触须数量变化
        })
      );
    }
  }

  // 动画循环
  function loop() {
    if (!ctx.running) return; // 如果没有启动动画，则不继续

    ctx.globalCompositeOperation = "source-over"; // 设置绘制模式
    ctx.fillStyle = "rgba(8,5,16,0.4)"; // 背景色
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); // 填充背景
    ctx.globalCompositeOperation = "lighter"; // 设置叠加模式
    ctx.strokeStyle = "hsla(" + Math.round(hue.update()) + ",90%,50%,0.25)"; // 设置描边颜色
    ctx.lineWidth = 1; // 设置描边宽度

    // 更新并绘制所有触须
    for (var i = 0, tendril; i < settings.trails; i++) {
      tendril = tendrils[i];
      tendril.update();
      tendril.draw();
    }

    ctx.frame++; // 更新帧数
    ctx.stats.update(); // 更新统计信息
    requestAnimFrame(loop); // 请求下一帧
  }

  // 调整画布大小
  function resize() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
  }

  // 启动动画
  function start() {
    if (!ctx.running) {
      ctx.running = true;
      loop(); // 开始循环
    }
  }

  // 停止动画
  function stop() {
    ctx.running = false;
  }

  // 鼠标移动事件
  function mousemove(event) {
    if (event.touches) {
      target.x = event.touches[0].pageX;
      target.y = event.touches[0].pageY;
    } else {
      target.x = event.clientX;
      target.y = event.clientY;
    }
    event.preventDefault(); // 阻止默认事件
  }

  // 触摸开始事件
  function touchstart(event) {
    if (event.touches.length == 1) {
      target.x = event.touches[0].pageX;
      target.y = event.touches[0].pageY;
    }
  }

  // 键盘按键事件
  function keyup(event) {
    switch (event.keyCode) {
      case 32: // 空格键
        save(); // 保存当前画面
        break;
      default:
      // 其他按键的处理
    }
  }

  // 处理文本的展示
  function letters(id) {
    var el = document.getElementById(id),
      letters = el.innerHTML.replace("&amp;", "&").split(""),
      heading = "";

    for (var i = 0, n = letters.length, letter; i < n; i++) {
      letter = letters[i].replace("&", "&amp");
      heading += letter.trim()
        ? '<span class="letter-' + i + '">' + letter + "</span>"
        : "&nbsp;"; // 用span包裹每个字母
    }

    el.innerHTML = heading; // 更新内容
    setTimeout(function () {
      el.className = "transition-in"; // 设置过渡动画
    }, Math.random() * 500 + 500);
  }

  // 保存画布为图像
  function save() {
    if (!buffer) {
      buffer = document.createElement("canvas"); // 创建一个临时canvas
      buffer.width = screen.availWidth;
      buffer.height = screen.availHeight;
      buffer.ctx = buffer.getContext("2d");

      form = document.createElement("form"); // 创建表单
      form.method = "post";
      form.input = document.createElement("input");
      form.input.type = "hidden"; // 隐藏提交字段
      form.input.name = "data";
      form.appendChild(form.input); // 将input添加到form中

      document.body.appendChild(form); // 将form添加到文档中
    }

    buffer.ctx.fillStyle = "rgba(8,5,16)"; // 设置背景色
    buffer.ctx.fillRect(0, 0, buffer.width, buffer.height); // 填充背景

    buffer.ctx.drawImage(
      canvas,
      Math.round(buffer.width / 2 - canvas.width / 2),
      Math.round(buffer.height / 2 - canvas.height / 2)
    ); // 绘制canvas图像

    buffer.ctx.drawImage(
      logo,
      Math.round(buffer.width / 2 - logo.width / 4),
      Math.round(buffer.height / 2 - logo.height / 4),
      logo.width / 2,
      logo.height / 2
    ); // 绘制logo

    window.open(
      buffer.toDataURL(), // 将buffer的图像转为DataURL
      "wallpaper",
      "top=0,left=0,width=" + buffer.width + ",height=" + buffer.height
    );

    // form.input.value = buffer.toDataURL().substr(22);
    // form.submit();
  }

  // 请求动画帧
  window.requestAnimFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (fn) {
        window.setTimeout(fn, 1000 / 60); // 60帧每秒
      }
    );
  })();

  // 页面加载后执行的初始化操作
  window.onload = function () {
    ctx = document.getElementById("canvas").getContext("2d"); // 获取canvas的上下文
    ctx.stats = new Stats(); // 初始化统计信息
    ctx.running = true; // 设置动画开始
    ctx.frame = 1;

    logo = new Image(); // 创建logo图片
    logo.src = "http://www.whsir.com/rewrite_now.png"; // 设置图片源

    hue = new Oscillator({
      phase: Math.random() * Math.TWO_PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 285,
    }); // 初始化色调振荡器

    letters("h1"); // 给h1元素应用动画
    letters("h2"); // 给h2元素应用动画

    // 绑定各种事件
    document.addEventListener("mousemove", init);
    document.addEventListener("touchstart", init);
    document.body.addEventListener("orientationchange", resize);
    window.addEventListener("resize", resize);
    window.addEventListener("keyup", keyup);
    window.addEventListener("focus", start);
    window.addEventListener("blur", stop);

    resize(); // 调整画布大小

    // 如果是调试模式，则开启GUI
    if (window.DEBUG) {
      var gui = new dat.GUI();
      settings.gui.add(settings, "trails", 1, 30).onChange(reset); // 触须数量控制
      settings.gui.add(settings, "size", 25, 75).onFinishChange(reset); // 节点大小控制
      settings.gui.add(settings, "friction", 0.45, 0.55).onFinishChange(reset); // 摩擦力控制
      settings.gui.add(settings, "dampening", 0.01, 0.4).onFinishChange(reset); // 阻尼控制
      settings.gui.add(settings, "tension", 0.95, 0.999).onFinishChange(reset); // 弹簧张力控制

      document.body.appendChild(ctx.stats.domElement); // 添加性能统计
    }
  };
})(window);
