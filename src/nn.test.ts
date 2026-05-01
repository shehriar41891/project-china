import { describe, it, expect } from 'vitest';
import {
  Activations,
  Errors,
  RegularizationFunction,
  buildNetwork,
  forwardProp,
  backProp,
  updateWeights,
  getOutputNode,
} from './nn';

describe('Activations forward pass', () => {
  it('TANH matches Math.tanh', () => {
    const x = 0.3;
    expect(Activations.TANH.output(x)).toBeCloseTo(Math.tanh(x), 6);
  });

  it('RELU clamps negatives', () => {
    expect(Activations.RELU.output(-2)).toBe(0);
    expect(Activations.RELU.output(3)).toBe(3);
  });

  it('SIGMOID maps to (0, 1)', () => {
    const y = Activations.SIGMOID.output(0);
    expect(y).toBeCloseTo(0.5, 6);
    expect(Activations.SIGMOID.output(4)).toBeGreaterThan(0.98);
  });

  it('LINEAR is identity', () => {
    expect(Activations.LINEAR.output(-1.25)).toBeCloseTo(-1.25, 8);
  });
});

describe('Backprop vs finite differences', () => {
  it('weight gradient matches numerical derivative (tanh hidden, sigmoid output)', () => {
    const shape = [2, 3, 1];
    const net = buildNetwork(
      shape,
      Activations.TANH,
      Activations.SIGMOID,
      RegularizationFunction.L2,
      ['in0', 'in1'],
      false
    );
    const inputs = [0.4, -0.7];
    const target = 0.65;
    const eps = 1e-5;

    const link = net[1][0].inputLinks[0];
    const w0 = link.weight;

    link.weight = w0 + eps;
    forwardProp(net, inputs);
    const errPlus = Errors.SQUARE.error(getOutputNode(net).output, target);

    link.weight = w0 - eps;
    forwardProp(net, inputs);
    const errMinus = Errors.SQUARE.error(getOutputNode(net).output, target);

    link.weight = w0;
    forwardProp(net, inputs);
    backProp(net, target, Errors.SQUARE);

    const analytical =
      link.numAccumulatedDers > 0 ? link.accErrorDer / link.numAccumulatedDers : link.errorDer;
    const numerical = (errPlus - errMinus) / (2 * eps);

    expect(analytical).toBeCloseTo(numerical, 4);
  });
});

describe('Training reduces loss', () => {
  it('loss trends down over iterations on a simple regression task', () => {
    const shape = [1, 4, 1];
    const net = buildNetwork(
      shape,
      Activations.RELU,
      Activations.LINEAR,
      RegularizationFunction.L2,
      ['x'],
      false
    );

    const xs = [-1, -0.5, 0, 0.5, 1];
    const ys = [-0.8, -0.2, 0.1, 0.55, 0.9];
    const lr = 0.08;
    const reg = 0;

    function epochLoss(): number {
      let sum = 0;
      for (let i = 0; i < xs.length; i++) {
        forwardProp(net, [xs[i]]);
        const out = getOutputNode(net).output;
        sum += Errors.SQUARE.error(out, ys[i]);
      }
      return sum / xs.length;
    }

    const losses: number[] = [];
    for (let e = 0; e < 80; e++) {
      for (let i = 0; i < xs.length; i++) {
        forwardProp(net, [xs[i]]);
        backProp(net, ys[i], Errors.SQUARE);
        updateWeights(net, lr, reg);
      }
      losses.push(epochLoss());
    }

    const head = losses.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const tail = losses.slice(-10).reduce((a, b) => a + b, 0) / 10;
    expect(tail).toBeLessThan(head);
    expect(tail).toBeLessThan(0.05);
  });
});
