/* Coopanion mind map renderer — zero dependency, pure DOM + SVG. */
(function () {
  'use strict';

  var COLORS = ['#C0392B', '#3C6E8F', '#2E8B57', '#6B4FA0',
                '#8a7a63', '#1D7A8C', '#8a5a2b', '#B7791F'];
  var LEVEL_W = [250, 250, 225, 205, 190];
  var V_GAP = 9;
  var H_GAP = 64;

  function clone(node) {
    var o = { t: node.t, c: null, _collapsed: false };
    if (node.c && node.c.length) o.c = node.c.map(clone);
    return o;
  }

  function visibleChildren(n) {
    return (n._collapsed || !n.c) ? [] : n.c;
  }

  function MindMap(container, tree) {
    this.el = container;
    this.tree = clone(tree);
    this.zoom = 1;
    this._build();
  }

  MindMap.prototype._build = function () {
    var el = this.el;
    el.innerHTML = '';
    el.classList.add('mm-viewport');

    var bar = document.createElement('div');
    bar.className = 'mm-toolbar';
    bar.innerHTML =
      '<span class="mm-title">🧠 算法全景导图</span>' +
      '<span class="mm-spacer"></span>' +
      '<button type="button" data-act="expand" title="展开全部">全部展开</button>' +
      '<button type="button" data-act="collapse" title="收起全部">全部收起</button>' +
      '<button type="button" data-act="out" title="缩小">−</button>' +
      '<span class="mm-zoomval">100%</span>' +
      '<button type="button" data-act="in" title="放大">+</button>' +
      '<button type="button" data-act="reset" title="复位">复位</button>';
    el.appendChild(bar);

    var stage = document.createElement('div');
    stage.className = 'mm-stage';
    var canvas = document.createElement('div');
    canvas.className = 'mm-canvas';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'mm-lines');
    var layer = document.createElement('div');
    layer.className = 'mm-nodes';
    canvas.appendChild(svg);
    canvas.appendChild(layer);
    stage.appendChild(canvas);
    el.appendChild(stage);

    this.stage = stage;
    this.canvas = canvas;
    this.svg = svg;
    this.layer = layer;

    var self = this;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'expand') { self._setAll(false); self._focusRoot(); }
      else if (act === 'collapse') { self._setAll(true); self._focusRoot(); }
      else if (act === 'in') self._zoom(1.15);
      else if (act === 'out') self._zoom(1 / 1.15);
      else if (act === 'reset') { self.zoom = 1; self._zoom(1); self.stage.scrollLeft = 0; self._focusRoot(); }
    });

    var dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.mm-node')) return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      sl = stage.scrollLeft; st = stage.scrollTop;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('mm-dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      stage.scrollLeft = sl - (e.clientX - sx);
      stage.scrollTop = st - (e.clientY - sy);
    });
    var stop = function () { dragging = false; stage.classList.remove('mm-dragging'); };
    stage.addEventListener('pointerup', stop);
    stage.addEventListener('pointercancel', stop);

    // 默认只展开根节点 + 8 个一级分支，避免 107 节点铺满视口看不到中心
    (function collapseDeep(n, depth) {
      if (depth > 0 && n.c) n._collapsed = true;
      n.c && n.c.forEach(function (c) { collapseDeep(c, depth + 1); });
    })(this.tree, 0);
    this._render();
  };

  MindMap.prototype._focusRoot = function () {
    var root = this.tree;
    if (!root || root.y == null) return;
    var stage = this.stage;
    stage.scrollLeft = Math.max(0, (root.x * this.zoom) - 40);
    stage.scrollTop = Math.max(0, ((root.y + root._h / 2) * this.zoom) - (stage.clientHeight / 2));
  };

  MindMap.prototype._setAll = function (collapsed) {
    var self = this;
    (function walk(n, depth) {
      if (depth > 0 && n.c) n._collapsed = collapsed;
      n.c && n.c.forEach(function (c) { walk(c, depth + 1); });
    })(this.tree, 0);
    this._render();
  };

  MindMap.prototype._zoom = function (factor) {
    this.zoom = Math.max(0.45, Math.min(2.2, this.zoom * factor));
    var w = parseFloat(this.canvas.getAttribute('data-w') || 0);
    var h = parseFloat(this.canvas.getAttribute('data-h') || 0);
    this.canvas.style.transform = 'scale(' + this.zoom + ')';
    this.stage.querySelector('.mm-sizer').style.width = (w * this.zoom) + 'px';
    this.stage.querySelector('.mm-sizer').style.height = (h * this.zoom) + 'px';
    this.el.querySelector('.mm-zoomval').textContent = Math.round(this.zoom * 100) + '%';
  };

  MindMap.prototype._render = function () {
    var self = this;
    var layer = this.layer;
    layer.innerHTML = '';
    this.svg.innerHTML = '';

    var nodes = [];
    (function collect(n, depth, colorIdx, parent) {
      n._depth = depth;
      n._color = COLORS[colorIdx % COLORS.length];
      n._parent = parent;
      nodes.push(n);
      var kids = visibleChildren(n);
      kids.forEach(function (c, i) {
        collect(c, depth + 1, depth === 0 ? i : colorIdx, n);
      });
    })(this.tree, 0, 0, null);

    nodes.forEach(function (n) {
      var d = document.createElement('div');
      d.className = 'mm-node' +
        (n._depth === 0 ? ' mm-root' : '') +
        (n._depth === 1 ? ' mm-branch' : '') +
        (n.c && n.c.length ? ' mm-haskids' : '');
      if (n._collapsed) d.classList.add('mm-collapsed');
      d.style.setProperty('--c', n._color);
      d.style.width = LEVEL_W[Math.min(n._depth, LEVEL_W.length - 1)] + 'px';
      var t = document.createElement('span');
      t.textContent = n.t;
      d.appendChild(t);
      n._el = d;
      layer.appendChild(d);

      if (n.c && n.c.length) {
        d.addEventListener('click', function (e) {
          e.stopPropagation();
          n._collapsed = !n._collapsed;
          self._render();
          if (!n._collapsed && n.y != null) {
            self.stage.scrollTop = Math.max(0, ((n.y + n._h / 2) * self.zoom) - (self.stage.clientHeight / 2));
            self.stage.scrollLeft = Math.max(0, (n.x * self.zoom) - 40);
          }
        });
      }
    });

    nodes.forEach(function (n) { n._h = n._el.offsetHeight; });

    (function measure(n) {
      var kids = visibleChildren(n);
      if (!kids.length) { n._sub = n._h; return n._sub; }
      var sum = 0;
      kids.forEach(function (c, i) { sum += measure(c) + (i ? V_GAP : 0); });
      n._sub = Math.max(n._h, sum);
      return n._sub;
    })(this.tree);

    var root = this.tree;
    var totalH = root._sub + 60;
    var maxRight = 0;
    (function place(n, left, centerY, depth) {
      var w = LEVEL_W[Math.min(depth, LEVEL_W.length - 1)];
      n.x = left;
      n.y = centerY - n._h / 2;
      n.w = w;
      maxRight = Math.max(maxRight, left + w);
      n._el.style.left = left + 'px';
      n._el.style.top = n.y + 'px';
      var kids = visibleChildren(n);
      if (!kids.length) return;
      var total = 0;
      kids.forEach(function (c, i) { total += c._sub + (i ? V_GAP : 0); });
      var cy = centerY - total / 2;
      var childLeft = left + w + H_GAP;
      kids.forEach(function (c) {
        place(c, childLeft, cy + c._sub / 2, depth + 1);
        cy += c._sub + V_GAP;
      });
    })(root, 30, totalH / 2, 0);

    var totalW = maxRight + 60;
    this.canvas.style.width = totalW + 'px';
    this.canvas.style.height = totalH + 'px';
    this.canvas.setAttribute('data-w', totalW);
    this.canvas.setAttribute('data-h', totalH);
    this.svg.setAttribute('width', totalW);
    this.svg.setAttribute('height', totalH);
    this.svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);

    var sizer = this.stage.querySelector('.mm-sizer');
    if (!sizer) {
      sizer = document.createElement('div');
      sizer.className = 'mm-sizer';
      this.stage.appendChild(sizer);
    }
    sizer.style.width = (totalW * this.zoom) + 'px';
    sizer.style.height = (totalH * this.zoom) + 'px';

    nodes.forEach(function (n) {
      visibleChildren(n).forEach(function (c) {
        var x1 = n.x + n.w, y1 = n.y + n._h / 2;
        var x2 = c.x, y2 = c.y + c._h / 2;
        var mid = (x1 + x2) / 2;
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + mid + ',' + y1 + ' ' + mid + ',' + y2 + ' ' + x2 + ',' + y2);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', c._color);
        p.setAttribute('stroke-width', c._depth === 1 ? '2.4' : '1.5');
        p.setAttribute('stroke-opacity', c._depth === 1 ? '0.65' : '0.42');
        self.svg.appendChild(p);
      });
    });
  };

  window.MindMap = MindMap;
})();
