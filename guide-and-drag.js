(function() {
  'use strict';

  var guideContent = {
    learningRate: '<strong>Learning rate</strong> controls how big each training step is. Too high and the network may overshoot; too low and it learns slowly. Try 0.01 to start.',
    activation: '<strong>Activation function</strong> transforms the weighted sum at each neuron so the network can learn non-linear patterns. ReLU is a good default; try others to see how the output changes.',
    regularization: '<strong>Regularization</strong> (L1 or L2) discourages large weights and helps prevent overfitting. Use "None" at first, then try L2 if the test loss goes up while training loss goes down.',
    data: '<strong>Data</strong>: pick a dataset (e.g. Circle, Spiral). The network will try to separate or fit the points. You can also drag activation blocks from the left and drop them on "Drop activation here" to change the activation function.'
  };

  var tourSteps = [
    { title: 'Welcome', text: 'This builder lets you create and train a small neural network. You can use the dropdowns or drag blocks from the left panel onto the drop zones.' },
    { title: 'Data', text: 'Choose a dataset (e.g. Circle or Spiral). The colored points are what the network will learn to classify or fit.' },
    { title: 'Network', text: 'The diagram in the middle shows your network: input features, hidden layers (with + / − to add or remove), and output. Line thickness shows connection weights.' },
    { title: 'Training', text: 'Click Play to train. Watch the loss values and the output plot. Try different activations (ReLU, Tanh, etc.) and learning rates to see how they affect learning.' },
    { title: 'You\'re set', text: 'Use the (i) icons next to labels for quick explanations. Have fun experimenting!' }
  ];

  var tourIndex = 0;
  var popover = document.getElementById('guide-popover');
  var tourOverlay = document.getElementById('guide-tour-overlay');
  var tourCard = document.getElementById('guide-tour-card');
  var tourTitle = document.getElementById('guide-tour-title');
  var tourText = document.getElementById('guide-tour-text');
  var tourNext = document.getElementById('guide-tour-next');
  var tourSkip = document.getElementById('guide-tour-skip');

  function showPopover(text, near) {
    if (!popover || !text) return;
    popover.innerHTML = text;
    popover.classList.add('visible');
    var rect = near.getBoundingClientRect();
    popover.style.left = (rect.left + window.scrollX) + 'px';
    popover.style.top = (rect.bottom + 6 + window.scrollY) + 'px';
  }

  function hidePopover() {
    if (popover) popover.classList.remove('visible');
  }

  function showTourStep() {
    if (tourIndex >= tourSteps.length) {
      tourCard.style.display = 'none';
      tourOverlay.classList.remove('visible');
      return;
    }
    var step = tourSteps[tourIndex];
    tourTitle.textContent = step.title;
    tourText.textContent = step.text;
    tourNext.textContent = tourIndex === tourSteps.length - 1 ? 'Done' : 'Next';
    tourCard.style.display = 'block';
    tourOverlay.classList.add('visible');
  }

  document.querySelectorAll('.guide-trigger').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      var id = el.getAttribute('data-guide');
      var text = guideContent[id];
      if (text) showPopover(text, el);
    });
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.guide-trigger') && !e.target.closest('.guide-popover')) hidePopover();
  });

  if (document.getElementById('guide-start-btn')) {
    document.getElementById('guide-start-btn').addEventListener('click', function() {
      tourIndex = 0;
      showTourStep();
    });
  }
  if (tourNext) {
    tourNext.addEventListener('click', function() {
      tourIndex++;
      showTourStep();
    });
  }
  if (tourSkip) {
    tourSkip.addEventListener('click', function() {
      tourCard.style.display = 'none';
      tourOverlay.classList.remove('visible');
    });
  }
  if (tourOverlay) {
    tourOverlay.addEventListener('click', function() {
      tourCard.style.display = 'none';
      tourOverlay.classList.remove('visible');
    });
  }

  // Auto-start tour if URL has ?guide=1
  if (window.location.search.indexOf('guide=1') !== -1) {
    setTimeout(function() {
      tourIndex = 0;
      showTourStep();
    }, 500);
  }

  // ——— Drag and drop ———
  var dropActivation = document.getElementById('drop-activation');
  var selectActivation = document.getElementById('activations');
  var addLayersBtn = document.getElementById('add-layers');

  document.querySelectorAll('.drag-item').forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        type: item.getAttribute('data-drag-type'),
        value: item.getAttribute('data-value')
      }));
      e.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', function() {
      item.classList.remove('dragging');
    });
  });

  function setupDropZone(zone, forId) {
    if (!zone) return;
    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function() {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      var raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        var data = JSON.parse(raw);
        if (data.type === 'activation' && data.value && selectActivation) {
          selectActivation.value = data.value;
          selectActivation.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (data.type === 'layer' && data.value === 'add' && addLayersBtn) {
          addLayersBtn.click();
        }
      } catch (err) {}
    });
  }

  setupDropZone(dropActivation, 'activations');
})();
