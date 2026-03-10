(function() {
  'use strict';

  var nodeIdCounter = 0;
  var nodes = {};
  var edges = [];
  var canvas = document.getElementById('node-canvas');
  var nodesContainer = document.getElementById('nodes-container');
  var edgeLayer = document.getElementById('edge-layer');
  var placeholder = document.getElementById('canvas-placeholder');
  var runResult = document.getElementById('run-result');

  function id() { return 'n' + (++nodeIdCounter); }

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
        '<button type="button" class="node-delete" aria-label="Remove">×</button>' +
        '<div class="node-title">Dataset</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Choose data</span><select class="node-select dataset-select">' +
            '<option value="circle">Circle</option><option value="xor">XOR</option><option value="gauss">Gaussian</option><option value="spiral">Spiral</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"></div><div class="outputs"><span class="port output" data-port="out"></span></div></div>';
    } else if (type === 'input') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove">×</button>' +
        '<div class="node-title">Input Layer</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Input size</span><select class="node-select input-size">' +
            '<option value="2">2</option>' +
          '</select></label>' +
          '<p class="node-hint">Receives data from Dataset</p>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"><span class="port input" data-port="in"></span></div><div class="outputs"><span class="port output" data-port="out"></span></div></div>';
    } else if (type === 'layer') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove">×</button>' +
        '<div class="node-title">Hidden Layer</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Neurons</span><select class="node-select layer-neurons">' +
            '<option value="2">2</option><option value="4">4</option><option value="6">6</option><option value="8">8</option>' +
          '</select></label>' +
          '<label class="node-field"><span>Activation</span><select class="node-select layer-activation">' +
            '<option value="relu">ReLU</option><option value="tanh">Tanh</option><option value="sigmoid">Sigmoid</option><option value="linear">Linear</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"><span class="port input" data-port="in"></span></div><div class="outputs"><span class="port output" data-port="out"></span></div></div>';
    } else if (type === 'output') {
      el.innerHTML =
        '<button type="button" class="node-delete" aria-label="Remove">×</button>' +
        '<div class="node-title">Output Layer</div>' +
        '<div class="node-body">' +
          '<label class="node-field"><span>Output activation</span><select class="node-select output-activation">' +
            '<option value="sigmoid">Sigmoid</option><option value="linear">Linear</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="node-ports"><div class="inputs"><span class="port input" data-port="in"></span></div><div class="outputs"></div></div>';
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
    dragNode(el, nid);
    updatePlaceholder();
    return nid;
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
      path.setAttribute('stroke', '#0d7ea4');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      edgeLayer.appendChild(path);
    });
  }

  function dragNode(el, nid) {
    var dragging = false;
    var dx = 0, dy = 0;
    el.addEventListener('mousedown', function(e) {
      if (e.target.closest('.port') || e.target.closest('.node-delete') || e.target.closest('select')) return;
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
    document.addEventListener('mouseup', function() { dragging = false; });
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
  });

  document.getElementById('btn-run').addEventListener('click', function() {
    var datasetNode = null;
    var inputNode = null;
    var outputNode = null;
    for (var nid in nodes) {
      if (nodes[nid].type === 'dataset') datasetNode = nid;
      if (nodes[nid].type === 'input') inputNode = nid;
      if (nodes[nid].type === 'output') outputNode = nid;
    }
    if (!datasetNode || !inputNode || !outputNode) {
      runResult.className = 'run-result visible error';
      runResult.innerHTML = 'Add <strong>Dataset</strong>, <strong>Input Layer</strong>, and <strong>Output Layer</strong>. Connect: Dataset → Input Layer → Hidden Layer(s) → Output Layer.';
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
      runResult.innerHTML = 'Connect a single path: <strong>Dataset</strong> → <strong>Input Layer</strong> → <strong>Hidden Layer(s)</strong> → <strong>Output Layer</strong>.';
      return;
    }
    var hasInput = path.some(function(nid) { return nodes[nid].type === 'input'; });
    if (!hasInput) {
      runResult.className = 'run-result visible error';
      runResult.innerHTML = 'Path must include <strong>Input Layer</strong>: Dataset → Input Layer → … → Output Layer.';
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
        var neurSel = n.el.querySelector('.node-select.layer-neurons');
        var actSel = n.el.querySelector('.node-select.layer-activation');
        layers.push(neurSel ? parseInt(neurSel.value, 10) : 2);
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

  // ——— User guide ———
  var guideSteps = [
    {
      title: 'Step 1: Add nodes',
      subtitle: 'Four distinct types. Drag each onto the canvas.',
      body: '<ol><li><strong>Dataset</strong> — choose training data (Circle, XOR, Gaussian, Spiral).</li><li><strong>Input Layer</strong> — the network input (receives data from Dataset).</li><li><strong>Hidden Layer</strong> — one or more, with neurons (2–8) and activation.</li><li><strong>Output Layer</strong> — the end, with output activation.</li></ol>'
    },
    {
      title: 'Step 2: Connect them',
      subtitle: 'Draw connections in order.',
      body: '<p>Connect: <strong>Dataset</strong> (out) → <strong>Input Layer</strong> (in), then <strong>Input Layer</strong> (out) → <strong>Hidden Layer</strong> (in), then Hidden → … → <strong>Output Layer</strong> (in).</p><p>One path: Dataset → Input Layer → Hidden(s) → Output Layer.</p>'
    },
    {
      title: 'Step 3: Configure',
      subtitle: 'Set options on each node.',
      body: '<p><strong>Dataset</strong>: pick Circle, XOR, Gaussian, or Spiral.</p><p><strong>Hidden Layer</strong>: neurons (2–8) and activation (ReLU, Tanh, etc.).</p><p><strong>Output Layer</strong>: output activation (Sigmoid or Linear).</p>'
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
