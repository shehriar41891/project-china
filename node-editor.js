(function() {
  'use strict';

  var nodeIdCounter = 0;
  var nodes = {};
  var edges = [];
  var restoring = false;
  var canvas = document.getElementById('node-canvas');
  var nodesContainer = document.getElementById('nodes-container');
  var edgeLayer = document.getElementById('edge-layer');
  var placeholder = document.getElementById('canvas-placeholder');
  var runResult = document.getElementById('run-result');

  function announce(msg) {
    var live = document.getElementById('editor-announcer');
    if (!live || !msg) return;
    live.textContent = '';
    setTimeout(function() {
      live.textContent = msg;
    }, 30);
  }

  function id() { return 'n' + (++nodeIdCounter); }

  /** Matches playground.ts neuron limits (1–8 per hidden layer). */
  function clampNeuronCount(raw) {
    var n = parseInt(String(raw), 10);
    if (isNaN(n)) return 4;
    return Math.max(1, Math.min(8, n));
  }

  function syncCanvasNodeAria(el) {
    var nid = el.dataset.nodeId;
    var n = nodes[nid];
    if (!n) return;
    var type = n.type;
    var summary = '';
    if (type === 'dataset') {
      var ds = el.querySelector('.dataset-select');
      var dv = ds ? ds.value : 'circle';
      summary = 'Dataset node. Selected data: ' + dv + '. Arrow keys move the node. Delete removes it.';
    } else if (type === 'layer') {
      var cnt = el.querySelector('.neuron-count');
      var act = el.querySelector('.layer-activation');
      var nc = cnt ? cnt.textContent : '4';
      var av = act ? act.value : 'relu';
      summary =
        'Hidden layer. Neurons: ' +
        nc +
        '. Activation: ' +
        av +
        '. Press [ or ] to cycle activation. Arrow keys move. Delete removes.';
    } else if (type === 'output') {
      var oa = el.querySelector('.output-activation');
      var ov = oa ? oa.value : 'sigmoid';
      summary = 'Output layer. Activation: ' + ov + '. Arrow keys move. Delete removes.';
    } else {
      summary = 'Network node';
    }
    el.setAttribute('aria-label', summary);
  }

  function moveNodeByKeyboard(nid, dx, dy) {
    var n = nodes[nid];
    if (!n || !n.el) return;
    var el = n.el;
    var cr = getCanvasRect();
    var left = (parseInt(el.style.left, 10) || 80) + dx;
    var top = (parseInt(el.style.top, 10) || 80) + dy;
    el.style.left = Math.max(0, Math.min((cr.width || 800) - 40, left)) + 'px';
    el.style.top = Math.max(0, Math.min((cr.height || 600) - 40, top)) + 'px';
    redrawEdges();
    saveGraph();
  }

  function cycleLayerActivation(layerEl, forward) {
    var sel = layerEl.querySelector('.layer-activation');
    if (!sel || sel.tagName !== 'SELECT') return;
    var i = sel.selectedIndex;
    var nOpt = sel.options.length;
    var next = forward ? (i + 1) % nOpt : (i - 1 + nOpt) % nOpt;
    sel.selectedIndex = next;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    var label = sel.options[next] ? sel.options[next].textContent : sel.value;
    announce('Activation: ' + label);
  }

  function onCanvasNodeKeydown(e, nid) {
    var fromInteractive =
      e.target &&
      (e.target.closest('select') ||
        e.target.closest('button') ||
        e.target.closest('.neuron-stepper'));
    if (fromInteractive && e.target !== e.currentTarget) return;

    var n = nodes[nid];
    if (!n) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveNodeByKeyboard(nid, -12, 0);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveNodeByKeyboard(nid, 12, 0);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveNodeByKeyboard(nid, 0, -12);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveNodeByKeyboard(nid, 0, 12);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeNode(nid);
      announce('Node removed');
      return;
    }
    if (n.type === 'layer' && (e.key === '[' || e.key === ']')) {
      e.preventDefault();
      cycleLayerActivation(n.el, e.key === ']');
    }
  }

  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  function createCanvasNode(type, label, value, x, y) {
    var nid = id();
    var el = document.createElement('div');
    el.className = 'canvas-node ' + type;
    el.dataset.nodeId = nid;
    el.style.left = (x || 80) + 'px';
    el.style.top = (y || 80) + 'px';

    if (type === 'dataset') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove dataset node">×</button>' +
        '<div class="node-title">Dataset</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Choose data</span><select class="node-select dataset-select" aria-label="Training dataset preset">' +
            '<option value="circle">Circle</option><option value="xor">XOR</option><option value="gauss">Gaussian</option><option value="spiral">Spiral</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"></div><div class="outputs"><span class="port output" data-port="out" aria-label="Output port: drag to connect to another node"></span></div></div>';
    } else if (type === 'layer') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove hidden layer node">×</button>' +
        '<div class="node-title">Hidden Layer</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Neurons (per layer)</span>' +
          '<div class="neuron-stepper" data-min="1" data-max="8">' +
            '<button type="button" class="neuron-btn neuron-minus" aria-label="Decrease neuron count">−</button>' +
            '<span class="neuron-count" aria-live="polite">4</span>' +
            '<button type="button" class="neuron-btn neuron-plus" aria-label="Increase neuron count">+</button>' +
          '</div></label>' +
          '<label class="node-field"><span>Activation</span><select class="node-select layer-activation" aria-label="Hidden layer activation function">' +
            '<option value="relu">ReLU</option><option value="tanh">Tanh</option><option value="sigmoid">Sigmoid</option><option value="linear">Linear</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"><span class="port input" data-port="in" aria-label="Input port: complete a connection here"></span></div><div class="outputs"><span class="port output" data-port="out" aria-label="Output port: drag to connect to another node"></span></div></div>';
    } else if (type === 'output') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove output layer node">×</button>' +
        '<div class="node-title">Output Layer</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Output activation</span><select class="node-select output-activation" aria-label="Output activation function">' +
            '<option value="sigmoid">Sigmoid</option><option value="linear">Linear</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"><span class="port input" data-port="in" aria-label="Input port: complete a connection here"></span></div><div class="outputs"></div></div>';
    } else {
      el.innerHTML = '<div class="node-title">' + (label || type) + '</div><div class="node-ports"><div class="inputs"><span class="port input" data-port="in"></span></div><div class="outputs"><span class="port output" data-port="out"></span></div></div>';
    }

    nodesContainer.appendChild(el);
    nodes[nid] = {
      id: nid,
      type: type,
      label: label || null,
      value: value || null,
      el: el
    };

    el.querySelector('.node-delete').addEventListener('click', function(e) {
      e.stopPropagation();
      removeNode(nid);
    });

    portListeners(el);
    if (type === 'dataset') {
      var dsSel = el.querySelector('.dataset-select');
      if (dsSel) {
        dsSel.addEventListener('change', function() {
          syncCanvasNodeAria(el);
          if (!restoring) saveGraph();
        });
      }
    }
    if (type === 'layer') {
      bindNeuronStepper(el);
      var actSel = el.querySelector('.node-select.layer-activation');
      if (actSel) {
        actSel.addEventListener('change', function() {
          syncCanvasNodeAria(el);
          if (!restoring) saveGraph();
        });
      }
    }
    if (type === 'output') {
      var outSel = el.querySelector('.output-activation');
      if (outSel) {
        outSel.addEventListener('change', function() {
          syncCanvasNodeAria(el);
          if (!restoring) saveGraph();
        });
      }
    }
    el.setAttribute('role', 'group');
    el.setAttribute('tabindex', '0');
    syncCanvasNodeAria(el);
    el.addEventListener('keydown', function(e) {
      onCanvasNodeKeydown(e, nid);
    });
    dragNode(el, nid);
    updatePlaceholder();
    if (!restoring) saveGraph();
    return nid;
  }

  function bindNeuronStepper(layerEl) {
    var wrap = layerEl.querySelector('.neuron-stepper');
    var countEl = layerEl.querySelector('.neuron-count');
    var minus = layerEl.querySelector('.neuron-btn.neuron-minus');
    var plus = layerEl.querySelector('.neuron-btn.neuron-plus');
    if (!wrap || !countEl || !minus || !plus) return;
    var min = parseInt(wrap.getAttribute('data-min') || '1', 10);
    var max = parseInt(wrap.getAttribute('data-max') || '8', 10);
    function syncUi(n) {
      var v = clampNeuronCount(n);
      countEl.textContent = String(v);
      minus.disabled = v <= min;
      plus.disabled = v >= max;
    }
    function getN() {
      return clampNeuronCount(countEl.textContent);
    }
    function setN(n) {
      syncUi(n);
      syncCanvasNodeAria(layerEl);
      if (!restoring) saveGraph();
    }
    minus.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      setN(getN() - 1);
    });
    plus.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      setN(getN() + 1);
    });
    syncUi(getN());
    syncCanvasNodeAria(layerEl);
  }

  function getNodeState(nid) {
    var n = nodes[nid];
    if (!n) return null;
    var el = n.el;
    var left = parseInt(el.style.left, 10) || 80;
    var top = parseInt(el.style.top, 10) || 80;
    var state = { id: nid, type: n.type, x: left, y: top };
    if (n.type === 'dataset') {
      var ds = el.querySelector('.node-select.dataset-select');
      state.dataset = ds ? ds.value : 'circle';
    } else if (n.type === 'layer') {
      var cnt = el.querySelector('.neuron-count');
      var act = el.querySelector('.node-select.layer-activation');
      state.neurons = cnt ? String(clampNeuronCount(cnt.textContent)) : '4';
      state.activation = act ? act.value : 'relu';
    } else if (n.type === 'output') {
      var outAct = el.querySelector('.node-select.output-activation');
      state.outputActivation = outAct ? outAct.value : 'sigmoid';
    }
    return state;
  }

  var graphPayload = function() {
    var nodeList = [];
    for (var nid in nodes) nodeList.push(getNodeState(nid));
    var edgeList = edges.map(function(e) { return { fromNode: e.fromNode, toNode: e.toNode }; });
    return { nodes: nodeList, edges: edgeList };
  };

  function saveGraph() {
    var payload = graphPayload();
    try {
      localStorage.setItem('nnp-editor-graph', JSON.stringify(payload));
    } catch (err) {}
    try {
      fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function() {});
    } catch (err) {}
  }

  function applyGraphData(data) {
    if (!data || !data.nodes || !data.nodes.length) return;
    restoring = true;
    var idMap = {};
    data.nodes.forEach(function(state) {
      var nid = createCanvasNode(state.type, state.label || null, state.value, state.x, state.y);
      idMap[state.id] = nid;
      var n = nodes[nid];
      if (!n || !n.el) return;
      if (state.type === 'dataset' && state.dataset) {
        var ds = n.el.querySelector('.node-select.dataset-select');
        if (ds) ds.value = state.dataset;
      } else if (state.type === 'layer') {
        var cnt = n.el.querySelector('.neuron-count');
        var act = n.el.querySelector('.node-select.layer-activation');
        if (cnt) {
          var nv = clampNeuronCount(state.neurons != null ? state.neurons : '4');
          cnt.textContent = String(nv);
          var wrap = n.el.querySelector('.neuron-stepper');
          var minus = n.el.querySelector('.neuron-btn.neuron-minus');
          var plus = n.el.querySelector('.neuron-btn.neuron-plus');
          if (wrap && minus && plus) {
            var lo = parseInt(wrap.getAttribute('data-min') || '1', 10);
            var hi = parseInt(wrap.getAttribute('data-max') || '8', 10);
            minus.disabled = nv <= lo;
            plus.disabled = nv >= hi;
          }
        }
        if (act) act.value = state.activation || 'relu';
      } else if (state.type === 'output' && state.outputActivation) {
        var outAct = n.el.querySelector('.node-select.output-activation');
        if (outAct) outAct.value = state.outputActivation;
      }
    });
    (data.edges || []).forEach(function(e) {
      var from = idMap[e.fromNode];
      var to = idMap[e.toNode];
      if (from && to) edges.push({ fromNode: from, fromPort: 'out', toNode: to, toPort: 'in' });
    });
    redrawEdges();
    updatePlaceholder();
    restoring = false;
    saveGraph();
  }

  function restoreGraph() {
    function fromLocal() {
      var raw;
      try { raw = localStorage.getItem('nnp-editor-graph'); } catch (err) { return; }
      if (!raw) return;
      try { applyGraphData(JSON.parse(raw)); } catch (err) {}
    }
    fetch('/api/graph').then(function(r) { return r.ok ? r.json() : null; }).then(function(data) {
      if (data && (data.nodes && data.nodes.length)) applyGraphData(data);
      else fromLocal();
    }).catch(function() { fromLocal(); });
  }

  function removeNode(nid) {
    var el = nodes[nid] && nodes[nid].el;
    if (el) el.remove();
    delete nodes[nid];
    edges = edges.filter(function(e) { return e.fromNode !== nid && e.toNode !== nid; });
    redrawEdges();
    updatePlaceholder();
  }

  function portListeners(nodeEl) {
    var nid = nodeEl.dataset.nodeId;
    nodeEl.querySelectorAll('.port.output').forEach(function(port) {
      port.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startConnection(nid, 'out', e);
      });
    });
    nodeEl.querySelectorAll('.port.input').forEach(function(port) {
      port.addEventListener('mouseup', function(e) {
        if (connecting) endConnection(nid, 'in', e);
      });
    });
  }

  var connecting = null;
  var previewLine = null;

  function startConnection(fromNode, fromPort, e) {
    connecting = { fromNode: fromNode, fromPort: fromPort };
    previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    previewLine.setAttribute('class', 'connection-preview');
    edgeLayer.appendChild(previewLine);
    updatePreview(e);
    document.addEventListener('mousemove', onConnectMove);
    document.addEventListener('mouseup', onConnectUp);
  }

  function endConnection(toNode, toPort) {
    if (!connecting || connecting.fromNode === toNode) return;
    edges.push({
      fromNode: connecting.fromNode,
      fromPort: 'out',
      toNode: toNode,
      toPort: 'in'
    });
    redrawEdges();
    cancelConnection();
    saveGraph();
  }

  function onConnectMove(e) {
    if (connecting) updatePreview(e);
  }

  function onConnectUp() {
    cancelConnection();
  }

  function cancelConnection() {
    connecting = null;
    if (previewLine && previewLine.parentNode) previewLine.parentNode.removeChild(previewLine);
    previewLine = null;
    document.removeEventListener('mousemove', onConnectMove);
    document.removeEventListener('mouseup', onConnectUp);
  }

  function updatePreview(e) {
    if (!previewLine || !connecting) return;
    var fromNode = nodes[connecting.fromNode];
    if (!fromNode) return;
    var outPort = fromNode.el.querySelector('.port.output');
    var r = getCanvasRect();
    var x1 = outPort.getBoundingClientRect().left - r.left + 6;
    var y1 = outPort.getBoundingClientRect().top - r.top + 6;
    var x2 = e.clientX - r.left;
    var y2 = e.clientY - r.top;
    previewLine.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + (x1 + 80) + ',' + y1 + ' ' + (x2 - 80) + ',' + y2 + ' ' + x2 + ',' + y2);
  }

  function getPortCenter(nodeEl, portKind) {
    var port = nodeEl.querySelector(portKind === 'out' ? '.port.output' : '.port.input');
    if (!port) return null;
    var r = port.getBoundingClientRect();
    var cr = getCanvasRect();
    return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
  }

  function redrawEdges() {
    while (edgeLayer.firstChild) edgeLayer.removeChild(edgeLayer.firstChild);
    edges.forEach(function(edge) {
      var fromEl = nodes[edge.fromNode] && nodes[edge.fromNode].el;
      var toEl = nodes[edge.toNode] && nodes[edge.toNode].el;
      if (!fromEl || !toEl) return;
      var p1 = getPortCenter(fromEl, 'out');
      var p2 = getPortCenter(toEl, 'in');
      if (!p1 || !p2) return;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var mid = (p1.x + p2.x) / 2;
      path.setAttribute('d', 'M' + p1.x + ',' + p1.y + ' C' + (mid + 60) + ',' + p1.y + ' ' + (mid - 60) + ',' + p2.y + ' ' + p2.x + ',' + p2.y);
      path.setAttribute('stroke', '#3b82f6');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      edgeLayer.appendChild(path);
    });
  }

  function dragNode(el, nid) {
    var dragging = false;
    var dx = 0, dy = 0;
    el.addEventListener('mousedown', function(e) {
      if (e.target.closest('.port') || e.target.closest('.node-delete') || e.target.closest('select') || e.target.closest('.neuron-stepper')) return;
      dragging = true;
      var r = el.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      var cr = getCanvasRect();
      var x = e.clientX - cr.left - dx;
      var y = e.clientY - cr.top - dy;
      el.style.left = Math.max(0, x) + 'px';
      el.style.top = Math.max(0, y) + 'px';
      redrawEdges();
    });
    document.addEventListener('mouseup', function() {
      dragging = false;
      saveGraph();
    });
  }

  function updatePlaceholder() {
    placeholder.classList.toggle('hidden', Object.keys(nodes).length > 0);
  }

  canvas.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  canvas.addEventListener('drop', function(e) {
    e.preventDefault();
    var raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      var cr = getCanvasRect();
      var x = e.clientX - cr.left - 60;
      var y = e.clientY - cr.top - 30;
      createCanvasNode(data.type, data.label, data.value, x, y);
    } catch (err) {}
  });

  document.querySelectorAll('.palette-node').forEach(function(paletteEl) {
    paletteEl.addEventListener('dragstart', function(e) {
      var type = paletteEl.dataset.nodeType;
      var label = paletteEl.dataset.label || '';
      var value = paletteEl.dataset.value || null;
      e.dataTransfer.setData('application/json', JSON.stringify({ type: type, label: label, value: value }));
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  document.getElementById('btn-clear').addEventListener('click', function() {
    Object.keys(nodes).forEach(function(nid) { removeNode(nid); });
    runResult.classList.remove('visible');
    try { localStorage.removeItem('nnp-editor-graph'); } catch (e) {}
    try {
      fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: [], edges: [] })
      }).catch(function() {});
    } catch (e) {}
  });

  document.getElementById('btn-run').addEventListener('click', function() {
    var datasetNode = null;
    var outputNode = null;
    for (var nid in nodes) {
      if (nodes[nid].type === 'dataset') datasetNode = nid;
      if (nodes[nid].type === 'output') outputNode = nid;
    }
    if (!datasetNode || !outputNode) {
      runResult.className = 'run-result visible error';
      runResult.innerHTML = 'Add <strong>Dataset</strong> and <strong>Output Layer</strong>. Connect: Dataset → Hidden Layer(s) → Output Layer.';
      return;
    }

    var inEdges = {};
    edges.forEach(function(edge) {
      if (!inEdges[edge.toNode]) inEdges[edge.toNode] = [];
      inEdges[edge.toNode].push(edge.fromNode);
    });
    var path = [];
    var current = outputNode;
    var seen = {};
    while (current) {
      if (seen[current]) break;
      seen[current] = true;
      path.push(current);
      if (current === datasetNode) break;
      var prev = inEdges[current];
      current = prev && prev[0] ? prev[0] : null;
    }
    path.reverse();
    if (path[0] !== datasetNode) {
      runResult.className = 'run-result visible error';
      runResult.innerHTML = 'Connect a single path: <strong>Dataset</strong> → <strong>Hidden Layer(s)</strong> → <strong>Output Layer</strong>.';
      return;
    }

    var datasetValue = 'circle';
    var dsSelect = nodes[datasetNode].el.querySelector('.node-select.dataset-select');
    if (dsSelect) datasetValue = dsSelect.value;

    var layers = [];
    var activation = 'relu';
    path.forEach(function(nid) {
      var n = nodes[nid];
      if (!n) return;
      if (n.type === 'layer') {
        var neurCnt = n.el.querySelector('.neuron-count');
        var actSel = n.el.querySelector('.node-select.layer-activation');
        layers.push(neurCnt ? clampNeuronCount(neurCnt.textContent) : 4);
        if (actSel) activation = actSel.value;
      }
    });
    if (layers.length === 0) layers = [2];

    var hash = '#dataset=' + encodeURIComponent(datasetValue) + '&activation=' + encodeURIComponent(activation) + '&networkShape=' + layers.join(',');
    var url = 'playground.html' + hash;
    runResult.className = 'run-result visible success';
    runResult.innerHTML =
      'Network: Dataset <strong>' + datasetValue + '</strong> → ' + layers.length + ' hidden layer(s) <strong>' + layers.join(', ') + '</strong> neurons, activation <strong>' + activation + '</strong>. ' +
      '<div class="run-actions"><a href="' + url + '">Open in Playground & start training</a></div>';
  });

  window.addEventListener('resize', redrawEdges);

  function addHiddenLayerNode() {
    var layerNids = Object.keys(nodes).filter(function(id) {
      return nodes[id] && nodes[id].type === 'layer';
    });
    var n = layerNids.length;
    var x = 120 + n * 48;
    var y = 90 + n * 36;
    createCanvasNode('layer', 'Hidden Layer', null, x, y);
  }

  function removeLastHiddenLayerNode() {
    var layerNids = Object.keys(nodes).filter(function(id) {
      return nodes[id] && nodes[id].type === 'layer';
    });
    if (!layerNids.length) return;
    layerNids.sort(function(a, b) {
      var na = parseInt(String(a).replace(/\D/g, ''), 10) || 0;
      var nb = parseInt(String(b).replace(/\D/g, ''), 10) || 0;
      return na - nb;
    });
    removeNode(layerNids[layerNids.length - 1]);
  }

  var btnAddHidden = document.getElementById('btn-add-hidden');
  var btnRemoveHidden = document.getElementById('btn-remove-hidden');
  if (btnAddHidden) btnAddHidden.addEventListener('click', addHiddenLayerNode);
  if (btnRemoveHidden) btnRemoveHidden.addEventListener('click', removeLastHiddenLayerNode);

  function paletteAddAtDefault(type, label, value) {
    var cr = getCanvasRect();
    var x = Math.max(40, (cr.width || 400) / 2 - 60);
    var y = Math.max(40, (cr.height || 300) / 2 - 40);
    createCanvasNode(type, label || null, value || null, x, y);
    announce(
      type === 'dataset' ? 'Dataset node added to canvas' :
      type === 'layer' ? 'Hidden layer added to canvas' :
      'Output layer added to canvas'
    );
  }

  document.querySelectorAll('.palette-node').forEach(function(paletteEl) {
    paletteEl.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      var type = paletteEl.dataset.nodeType;
      var label = paletteEl.dataset.label || '';
      var value = paletteEl.dataset.value || null;
      paletteAddAtDefault(type, label, value);
    });
  });

  document.addEventListener(
    'keydown',
    function(e) {
      if (!e.altKey || e.code !== 'KeyL') return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return;
      e.preventDefault();
      if (e.shiftKey) {
        removeLastHiddenLayerNode();
        announce('Removed last hidden layer');
      } else {
        addHiddenLayerNode();
        announce('Added hidden layer');
      }
    },
    true
  );

  // Restore saved graph when returning to the editor
  restoreGraph();

  // ——— User guide ———
  var guideSteps = [
    {
      title: 'Step 1: Add nodes',
      subtitle: 'Three types. Drag onto the canvas.',
      body: '<ol><li><strong>Dataset</strong> — choose data (Circle, XOR, Gaussian, Spiral).</li><li><strong>Hidden Layer</strong> — one or more; use <strong>− / +</strong> to set neurons per layer (1–8, same as the Playground) and pick an activation.</li><li><strong>Output Layer</strong> — the end, with output activation.</li></ol>'
    },
    {
      title: 'Step 2: Connect them',
      subtitle: 'Dataset → Hidden(s) → Output.',
      body: '<p>Connect <strong>Dataset</strong> (out) → <strong>Hidden Layer</strong> (in), then Hidden (out) → next Hidden or <strong>Output Layer</strong> (in). One path: Dataset → Hidden(s) → Output Layer.</p>'
    },
    {
      title: 'Step 3: Configure',
      subtitle: 'Set options on each node.',
      body: '<p><strong>Dataset</strong>: pick Circle, XOR, Gaussian, or Spiral.</p><p><strong>Hidden Layer</strong>: tap <strong>− / +</strong> to change neuron count (1–8 per layer) and choose activation (ReLU, Tanh, etc.).</p><p><strong>Output Layer</strong>: output activation (Sigmoid or Linear).</p>'
    },
    {
      title: 'Step 4: Run training',
      subtitle: 'Open the playground and train.',
      body: '<p>Click <strong>Run training</strong> in the header. If your graph is valid, a link will appear: <strong>Open in Playground & start training</strong>.</p><p>There you can press Play to train and watch the loss and decision boundary.</p>'
    }
  ];
  var guideIndex = 0;
  var guideOverlay = document.getElementById('guide-overlay');
  var guideTitle = document.getElementById('guide-title');
  var guideSubtitle = document.getElementById('guide-subtitle');
  var guideBody = document.getElementById('guide-body');
  var guideDots = document.getElementById('guide-dots');
  var guideNext = document.getElementById('guide-next');
  var guideClose = document.getElementById('guide-close');

  function showGuideStep(index) {
    guideIndex = index;
    var step = guideSteps[guideIndex];
    if (!step) return;
    guideTitle.textContent = step.title;
    guideSubtitle.textContent = step.subtitle;
    guideBody.innerHTML = step.body;
    guideDots.innerHTML = '';
    guideSteps.forEach(function(_, i) {
      var dot = document.createElement('span');
      if (i === guideIndex) dot.classList.add('active');
      guideDots.appendChild(dot);
    });
    guideNext.textContent = guideIndex < guideSteps.length - 1 ? 'Next' : 'Finish';
    guideOverlay.classList.add('visible');
  }

  document.getElementById('btn-guide').addEventListener('click', function() {
    showGuideStep(0);
  });
  guideNext.addEventListener('click', function() {
    if (guideIndex < guideSteps.length - 1) {
      showGuideStep(guideIndex + 1);
    } else {
      guideOverlay.classList.remove('visible');
    }
  });
  guideClose.addEventListener('click', function() {
    guideOverlay.classList.remove('visible');
  });
  guideOverlay.addEventListener('click', function(e) {
    if (e.target === guideOverlay) guideOverlay.classList.remove('visible');
  });
})();
