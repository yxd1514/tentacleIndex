// Stats类 - 性能监控工具
var Stats = function () {
  // 时间相关变量
  var e = Date.now(), // 当前时间
    t = e, // 上一帧时间
    i = 0, // 当前帧耗时
    n = 1 / 0, // 最小帧耗时
    r = 0, // 最大帧耗时
    s = 0, // FPS值
    o = 1 / 0, // 最小FPS
    a = 0, // 最大FPS
    l = 0, // 帧计数器
    h = 0; // 显示模式(0:FPS, 1:MS)

  // 创建主容器
  var c = document.createElement("div");
  c.id = "stats";
  c.addEventListener(
    "mousedown",
    function (e) {
      e.preventDefault();
      v(++h % 2); // 点击切换显示模式
    },
    !1
  );
  c.style.cssText = "width:80px;opacity:0.9;cursor:pointer";

  // 创建FPS显示面板
  var u = document.createElement("div");
  u.id = "fps";
  u.style.cssText = "padding:0 0 3px 3px;text-align:left;background-color:#002";
  c.appendChild(u);

  // FPS文本
  var d = document.createElement("div");
  d.id = "fpsText";
  d.style.cssText =
    "color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
  d.innerHTML = "FPS";
  u.appendChild(d);

  // FPS图表
  var p = document.createElement("div");
  p.id = "fpsGraph";
  p.style.cssText =
    "position:relative;width:74px;height:30px;background-color:#0ff";
  u.appendChild(p);

  // 创建图表柱状条
  for (; 74 > p.children.length; ) {
    var f = document.createElement("span");
    f.style.cssText = "width:1px;height:30px;float:left;background-color:#113";
    p.appendChild(f);
  }

  // 创建MS(毫秒)显示面板
  var m = document.createElement("div");
  m.id = "ms";
  m.style.cssText =
    "padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";
  c.appendChild(m);

  // MS文本
  var g = document.createElement("div");
  g.id = "msText";
  g.style.cssText =
    "color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
  g.innerHTML = "MS";
  m.appendChild(g);

  // MS图表
  var y = document.createElement("div");
  y.id = "msGraph";
  y.style.cssText =
    "position:relative;width:74px;height:30px;background-color:#0f0";
  m.appendChild(y);

  // 创建图表柱状条
  for (; 74 > y.children.length; ) {
    var f = document.createElement("span");
    f.style.cssText = "width:1px;height:30px;float:left;background-color:#131";
    y.appendChild(f);
  }

  // 切换显示模式的函数
  var v = function (e) {
    switch ((h = e)) {
      case 0: // 显示FPS面板
        u.style.display = "block";
        m.style.display = "none";
        break;
      case 1: // 显示MS面板
        u.style.display = "none";
        m.style.display = "block";
    }
  };

  // 更新图表的函数
  var b = function (e, t) {
    var i = e.appendChild(e.firstChild);
    i.style.height = t + "px";
  };

  // 返回Stats对象的公共接口
  return {
    REVISION: 11,
    domElement: c, // DOM元素
    setMode: v, // 设置显示模式

    // 开始计时
    begin: function () {
      e = Date.now();
    },

    // 结束计时并更新显示
    end: function () {
      var h = Date.now();

      // 计算各项指标
      i = h - e; // 当前帧耗时
      n = Math.min(n, i); // 最小耗时
      r = Math.max(r, i); // 最大耗时
      g.textContent = i + " MS (" + n + "-" + r + ")"; // 更新MS文本

      // 更新MS图表
      b(y, Math.min(30, 30 - 30 * (i / 200)));

      l++; // 帧计数增加

      // 每秒更新一次FPS
      if (h > t + 1e3) {
        s = Math.round((1e3 * l) / (h - t)); // 计算FPS
        o = Math.min(o, s); // 最小FPS
        a = Math.max(a, s); // 最大FPS
        d.textContent = s + " FPS (" + o + "-" + a + ")"; // 更新FPS文本

        // 更新FPS图表
        b(p, Math.min(30, 30 - 30 * (s / 100)));

        t = h; // 更新时间
        l = 0; // 重置帧计数
      }

      return h;
    },

    // 更新函数
    update: function () {
      e = this.end();
    },
  };
};
